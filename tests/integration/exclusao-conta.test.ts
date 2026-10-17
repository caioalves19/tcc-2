import type { Client } from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";
import { comCookie, prepararContas, SENHA } from "./contas-pbi17";
import { fabricaDePedidos, type ClienteTeste } from "./pedidos-de-teste";

// PBI-40 (RN12, RNF19): o cliente exclui a própria conta; os dados pessoais são anonimizados e os
// pedidos pagos ficam, com os mesmos valores, para o registro da venda.

let db: Client;
let fabrica: ReturnType<typeof fabricaDePedidos>;
let obras: string[];
let admin: Headers;
let artista: Headers;

beforeAll(async () => {
  const contas = await prepararContas("kolo_pbi40_exclusao_conta_test");
  db = contas.db;
  admin = contas.admin;
  artista = contas.ana;
  fabrica = fabricaDePedidos(db, contas.admin, contas.idAna);
  obras = [];
  for (const slug of ["muro", "viaduto", "praca", "beco", "ponte", "trilho"])
    obras.push(await fabrica.obraPublicada(slug, "4.800,00", 50));
}, 120_000);
afterAll(async () => {
  await db?.end();
});

function obra(indice: number): string {
  const id = obras[indice];
  if (id === undefined) throw new Error("Obra de teste inexistente");
  return id;
}

const CONFIRMADA = { senha: SENHA, confirmo: true };

async function excluir(entrada: unknown, cabecalhos: Headers) {
  const { excluirPropriaConta } = await import("../../src/modules/customers");
  return excluirPropriaConta(entrada, cabecalhos);
}

async function contaDe(cliente: ClienteTeste) {
  const { rows } = await db.query(
    'SELECT nome, email, telefone, imagem, excluido_em FROM "user" WHERE id = $1',
    [cliente.userId],
  );
  return rows[0];
}

it("RN12 a conta excluída fica anônima e o pedido pago continua com os mesmos valores", async () => {
  const lucas = await fabrica.novoCliente("lucas@pbi40.test", "Lucas Silveira");
  const pedido = await fabrica.pedidoDeTeste(lucas, {
    numero: "K40-0001",
    situacao: "ENTREGUE",
    criadoEm: "2026-09-01T12:00:00Z",
    pagoEm: "2026-09-01T12:05:00Z",
    obra: obra(0),
    pagamentos: ["APROVADO"],
  });

  expect(await excluir(CONFIRMADA, lucas.cabecalhos)).toEqual({ ok: true });

  const conta = await contaDe(lucas);
  expect(conta).toMatchObject({
    nome: "Cliente excluído",
    email: `excluido-${lucas.userId}@kolo.invalid`,
    telefone: null,
    imagem: null,
  });
  expect(conta.excluido_em).not.toBeNull();

  const { rows } = await db.query(
    `SELECT o.numero, o.situacao, o.user_id, o.subtotal_centavos, o.total_centavos, o.endereco_copia,
            i.titulo_copia, i.preco_centavos_copia, i.quantidade, p.situacao AS pagamento, p.valor_centavos
       FROM "order" o JOIN order_item i ON i.order_id = o.id JOIN payment p ON p.order_id = o.id
      WHERE o.id = $1`,
    [pedido],
  );
  expect(rows).toEqual([
    {
      numero: "K40-0001",
      situacao: "ENTREGUE",
      user_id: lucas.userId,
      subtotal_centavos: 960000,
      total_centavos: 960000,
      endereco_copia: {
        destinatario: "",
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "São Paulo",
        uf: "SP",
      },
      titulo_copia: "Metrópole em chamas",
      preco_centavos_copia: 480000,
      quantidade: 2,
      pagamento: "APROVADO",
      valor_centavos: 960000,
    },
  ]);
});

it("RN12 a exclusão revoga as sessões e apaga senha, endereço, carrinho e códigos de recuperação", async () => {
  const { entrar, sessaoDaRequisicao } = await import("../../src/lib/auth");
  const maria = await fabrica.novoCliente("maria@pbi40.test", "Maria Prado");
  const login = { email: "maria@pbi40.test", senha: SENHA, ip: "203.0.113.40" };
  const outroNavegador = await entrar(login);
  if (!outroNavegador.ok) throw new Error("Falha ao abrir a segunda sessão");
  await db.query(
    `INSERT INTO cart (id, user_id, atualizado_em) VALUES (gen_random_uuid(), $1, now())`,
    [maria.userId],
  );
  await db.query(
    `INSERT INTO cart_item (id, cart_id, artwork_id, quantidade, adicionado_em)
     SELECT gen_random_uuid(), c.id, $2, 1, now() FROM cart c WHERE c.user_id = $1`,
    [maria.userId, obra(1)],
  );
  await db.query(
    `INSERT INTO verification (id, identificador, valor, expira_em)
     VALUES (gen_random_uuid(), 'hash-do-token', $1, now() + interval '1 hour')`,
    [maria.userId],
  );

  expect(await excluir(CONFIRMADA, maria.cabecalhos)).toEqual({ ok: true });

  expect(await sessaoDaRequisicao(maria.cabecalhos)).toBeNull();
  expect(await sessaoDaRequisicao(await comCookie(outroNavegador.token))).toBeNull();
  for (const [tabela, coluna] of [
    ["session", "user_id"],
    ["account", "user_id"],
    ["address", "user_id"],
    ["cart", "user_id"],
    ["verification", "valor"],
  ]) {
    const { rows } = await db.query(
      `SELECT count(*)::int AS n FROM ${tabela} WHERE ${coluna} = $1`,
      [maria.userId],
    );
    expect([tabela, rows[0].n]).toEqual([tabela, 0]);
  }
  const { rows: itens } = await db.query(
    "SELECT count(*)::int AS n FROM cart_item WHERE artwork_id = $1",
    [obra(1)],
  );
  expect(itens[0].n).toBe(0);
  expect(await entrar(login)).toEqual({ ok: false, erro: "credenciais_invalidas" });
});

it("RN12 o pedido aguardando pagamento é cancelado e solta a reserva; os outros não mudam", async () => {
  const caio = await fabrica.novoCliente("caio@pbi40.test", "Caio Prado");
  const pendente = await fabrica.pedidoDeTeste(caio, {
    numero: "K40-0003",
    situacao: "PENDENTE",
    criadoEm: "2026-10-16T12:00:00Z",
    obra: obra(2),
    pagamentos: ["PENDENTE"],
    reservaAte: "2099-01-01T00:00:00Z",
  });
  const cancelado = await fabrica.pedidoDeTeste(caio, {
    numero: "K40-0004",
    situacao: "CANCELADO",
    criadoEm: "2026-10-01T12:00:00Z",
    obra: obra(3),
    pagamentos: ["ESTORNADO"],
  });

  expect(await excluir(CONFIRMADA, caio.cabecalhos)).toEqual({ ok: true });

  const { rows } = await db.query(
    `SELECT o.numero, o.situacao, p.situacao AS pagamento FROM "order" o
       JOIN payment p ON p.order_id = o.id WHERE o.id = ANY($1) ORDER BY o.numero`,
    [[pendente, cancelado]],
  );
  expect(rows).toEqual([
    { numero: "K40-0003", situacao: "CANCELADO", pagamento: "PENDENTE" },
    { numero: "K40-0004", situacao: "CANCELADO", pagamento: "ESTORNADO" },
  ]);
  const { rows: reservas } = await db.query(
    "SELECT count(*)::int AS n FROM artwork_reservation WHERE artwork_id = $1",
    [obra(2)],
  );
  expect(reservas[0].n).toBe(0);
});

it("RN12 a agenda perde o vínculo com a conta e o registro de e-mail perde o destinatário", async () => {
  const bruna = await fabrica.novoCliente("bruna@pbi40.test", "Bruna Lima");
  const { rows: artista } = await db.query("SELECT id FROM artist WHERE slug = 'ana'");
  await db.query(
    `INSERT INTO appointment (id, codigo, user_id, nome_contato, telefone_contato, artist_id, inicia_em, termina_em)
     VALUES (gen_random_uuid(), 'PBI40', $1, 'Bruna Lima', '11912345678', $2,
             '2026-11-10T13:00:00Z', '2026-11-10T15:00:00Z')`,
    [bruna.userId, artista[0].id],
  );
  await db.query(
    `INSERT INTO email_log (id, user_id, destinatario, template, situacao, enviado_em)
     VALUES (gen_random_uuid(), $1, 'bruna@pbi40.test', 'recuperacao', 'ENVIADO', now())`,
    [bruna.userId],
  );

  expect(await excluir(CONFIRMADA, bruna.cabecalhos)).toEqual({ ok: true });

  const { rows: agenda } = await db.query(
    "SELECT user_id, nome_contato, telefone_contato FROM appointment WHERE codigo = 'PBI40'",
  );
  // O registro do atendimento é da equipe: fica, sem a ligação com a conta.
  expect(agenda).toEqual([
    { user_id: null, nome_contato: "Bruna Lima", telefone_contato: "11912345678" },
  ]);
  const { rows: emails } = await db.query(
    "SELECT destinatario, template FROM email_log WHERE user_id = $1",
    [bruna.userId],
  );
  expect(emails).toEqual([
    { destinatario: `excluido-${bruna.userId}@kolo.invalid`, template: "recuperacao" },
  ]);
});

async function semMudanca(cliente: ClienteTeste, email: string) {
  const { sessaoDaRequisicao } = await import("../../src/lib/auth");
  expect(await contaDe(cliente)).toMatchObject({ email, excluido_em: null });
  expect(await sessaoDaRequisicao(cliente.cabecalhos)).not.toBeNull();
  const { rows } = await db.query("SELECT count(*)::int AS n FROM address WHERE user_id = $1", [
    cliente.userId,
  ]);
  expect(rows[0].n).toBe(1);
}

it.each(["PAGO", "PROCESSANDO", "ENVIADO"] as const)(
  "RN12 com pedido %s ainda não entregue a conta não é excluída",
  async (situacao) => {
    const email = `andamento-${situacao.toLowerCase()}@pbi40.test`;
    const cliente = await fabrica.novoCliente(email, "Rita Andamento");
    await fabrica.pedidoDeTeste(cliente, {
      numero: `K40-${situacao}`,
      situacao,
      criadoEm: "2026-10-15T12:00:00Z",
      pagoEm: "2026-10-15T12:05:00Z",
      obra: obra(4),
      pagamentos: ["APROVADO"],
    });
    const pendente = await fabrica.pedidoDeTeste(cliente, {
      numero: `K40-${situacao}-P`,
      situacao: "PENDENTE",
      criadoEm: "2026-10-16T12:00:00Z",
      obra: obra(5),
    });

    expect(await excluir(CONFIRMADA, cliente.cabecalhos)).toEqual({
      ok: false,
      erro: "pedido_em_andamento",
      mensagem:
        "Você tem um pedido a caminho. Aguarde a entrega para excluir a conta ou fale com o ateliê.",
    });

    await semMudanca(cliente, email);
    const { rows } = await db.query(
      `SELECT situacao, endereco_copia->>'destinatario' AS destinatario FROM "order" WHERE id = $1`,
      [pendente],
    );
    expect(rows).toEqual([{ situacao: "PENDENTE", destinatario: "Lucas Silveira" }]);
  },
);

it("RN12 sem a senha certa ou sem a confirmação a conta não é excluída", async () => {
  const email = "confirma@pbi40.test";
  const cliente = await fabrica.novoCliente(email, "Davi Confirma");

  expect(await excluir({ senha: "senha-errada-999", confirmo: true }, cliente.cabecalhos)).toEqual({
    ok: false,
    erro: "senha_incorreta",
    mensagem: "Senha atual incorreta.",
  });
  expect(await excluir({ senha: SENHA, confirmo: false }, cliente.cabecalhos)).toEqual({
    ok: false,
    erro: "invalido",
    campos: { confirmo: "Confirme que entende que a exclusão não pode ser desfeita." },
  });
  expect(await excluir({ senha: "", confirmo: true }, cliente.cabecalhos)).toEqual({
    ok: false,
    erro: "invalido",
    campos: { senha: "Informe sua senha atual." },
  });
  expect(await excluir(null, cliente.cabecalhos)).toMatchObject({ ok: false, erro: "invalido" });

  await semMudanca(cliente, email);
});

it("RN12 só o próprio cliente, conectado, exclui a conta; artista e admin não", async () => {
  expect(await excluir(CONFIRMADA, new Headers())).toEqual({
    ok: false,
    erro: "nao_autenticado",
    mensagem: "Sua sessão expirou. Entre novamente.",
  });
  for (const [cabecalhos, email] of [
    [artista, "ana@pbi17.test"],
    [admin, "admin@pbi17.test"],
  ] as const) {
    expect(await excluir(CONFIRMADA, cabecalhos)).toEqual({
      ok: false,
      erro: "proibido",
      mensagem: "Só a conta de cliente pode ser excluída pelo site. Fale com o ateliê.",
    });
    const { rows } = await db.query('SELECT excluido_em FROM "user" WHERE email = $1', [email]);
    expect(rows).toEqual([{ excluido_em: null }]);
  }
});

it("RN12 o admin vê a conta excluída com as compras e o e-mail antigo serve para uma conta nova", async () => {
  const { cadastrarCliente } = await import("../../src/lib/auth");
  const { lerClienteAdmin } = await import("../../src/modules/customers");
  const email = "helena@pbi40.test";
  const helena = await fabrica.novoCliente(email, "Helena Duarte");
  await fabrica.pedidoDeTeste(helena, {
    numero: "K40-0010",
    situacao: "ENTREGUE",
    criadoEm: "2026-09-10T12:00:00Z",
    pagoEm: "2026-09-10T12:05:00Z",
    obra: obra(0),
    pagamentos: ["APROVADO"],
  });

  expect(await excluir(CONFIRMADA, helena.cabecalhos)).toEqual({ ok: true });

  const perfil = await lerClienteAdmin(helena.userId, admin);
  if (!perfil.ok) throw new Error(perfil.mensagem);
  expect(perfil.dados).toMatchObject({
    nome: "Cliente excluído",
    email: `excluido-${helena.userId}@kolo.invalid`,
    telefone: null,
    excluido: true,
    endereco: null,
    totalGastoCentavos: 960000,
  });
  expect(perfil.dados.pedidos.map((p) => p.numero)).toEqual(["K40-0010"]);

  const nova = await cadastrarCliente({
    nome: "Helena Duarte",
    email,
    telefone: "11987654321",
    senha: SENHA,
  });
  expect(nova.ok).toBe(true);
});

it("RN12 um pagamento aprovado durante a exclusão vence: o pedido fica pago e a conta, intacta", async () => {
  const { Client } = await import("pg");
  const email = "corrida@pbi40.test";
  const cliente = await fabrica.novoCliente(email, "Nina Corrida");
  const pedido = await fabrica.pedidoDeTeste(cliente, {
    numero: "K40-0020",
    situacao: "PENDENTE",
    criadoEm: "2026-10-16T12:00:00Z",
    obra: obra(1),
    pagamentos: ["PENDENTE"],
  });
  // O webhook segura o usuário e o pedido (mesma ordem de travas) e aprova o pagamento.
  const webhook = new Client({ connectionString: process.env.DATABASE_URL });
  await webhook.connect();
  try {
    await webhook.query("BEGIN");
    await webhook.query('SELECT id FROM "user" WHERE id = $1 FOR UPDATE', [cliente.userId]);
    await webhook.query('SELECT id FROM "order" WHERE id = $1 FOR UPDATE', [pedido]);
    await webhook.query(`UPDATE "order" SET situacao = 'PAGO', pago_em = now() WHERE id = $1`, [
      pedido,
    ]);

    const exclusao = excluir(CONFIRMADA, cliente.cabecalhos);
    // Espera a exclusão parar numa trava antes de o webhook terminar.
    for (let tentativa = 0; tentativa < 100; tentativa++) {
      const { rows } = await db.query(
        `SELECT count(*)::int AS n FROM pg_stat_activity
          WHERE datname = current_database() AND wait_event_type = 'Lock'`,
      );
      if (rows[0].n > 0) break;
      await new Promise((pronto) => setTimeout(pronto, 50));
    }
    await webhook.query("COMMIT");

    expect(await exclusao).toMatchObject({ ok: false, erro: "pedido_em_andamento" });
  } finally {
    await webhook.end();
  }
  await semMudanca(cliente, email);
  const { rows } = await db.query(`SELECT situacao FROM "order" WHERE id = $1`, [pedido]);
  expect(rows).toEqual([{ situacao: "PAGO" }]);
});
