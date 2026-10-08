import type { Client } from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";
import { comCookie, prepararContas, SENHA } from "./contas-pbi17";

let db: Client;
let admin: Headers;
let idAna: string;

beforeAll(async () => {
  ({ db, admin, idAna } = await prepararContas("kolo_pbi26_checkout_test"));
}, 120_000);
afterAll(async () => {
  await db?.end();
});

const ENDERECO = {
  destinatario: "Lucas Silveira",
  cep: "01327000",
  logradouro: "Rua Treze de Maio",
  numero: "450",
  complemento: "Apto 82",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "sp",
};

// Cada teste usa um cliente novo, para um carrinho não vazar no outro.
async function novoCliente(email: string, comEndereco = true) {
  const { cadastrarCliente } = await import("../../src/lib/auth");
  const { salvarEndereco } = await import("../../src/lib/endereco");
  const cadastro = await cadastrarCliente({
    nome: "Cliente",
    email,
    telefone: "11987654321",
    senha: SENHA,
  });
  if (!cadastro.ok) throw new Error("Falha ao cadastrar cliente");
  const cabecalhos = await comCookie(cadastro.token);
  if (comEndereco) {
    const salvo = await salvarEndereco(ENDERECO, cabecalhos);
    if (!salvo.ok) throw new Error("Falha ao salvar endereço");
  }
  return { cabecalhos, tokenVisitante: null };
}

// Obra pronta para venda: cadastrada, com imagem e publicada pelo catálogo do PBI-18.
async function obraPublicada(slug: string, preco: string, estoque: number) {
  const { criarObra, editarObra } = await import("../../src/modules/catalog");
  const ficha = { titulo: `Obra ${slug}`, slug, artistaId: idAna, preco, estoque: String(estoque) };
  const criada = await criarObra(ficha, admin);
  if (!criada.ok) throw new Error(criada.mensagem);
  await db.query(
    "INSERT INTO artwork_image (id, artwork_id, url, ordem, principal, texto_alternativo) VALUES (gen_random_uuid(), $1, $2, 1, true, 'Foto')",
    [criada.dados.id, `obras/${idAna}/${criada.dados.id}.png`],
  );
  const publicada = await editarObra({ ...ficha, id: criada.dados.id, publicada: true }, admin);
  if (!publicada.ok) throw new Error(publicada.mensagem);
  return criada.dados.id;
}

async function noCarrinho(
  contexto: { cabecalhos: Headers; tokenVisitante: null },
  itens: [string, number][],
) {
  const { adicionarAoCarrinho } = await import("../../src/modules/orders");
  for (const [obraId, quantidade] of itens) {
    const adicionado = await adicionarAoCarrinho({ obraId, quantidade }, contexto);
    if (!adicionado.ok) throw new Error(adicionado.mensagem);
  }
}

it("RF12 o resumo traz itens, endereço, retirada sem custo e total calculados no servidor", async () => {
  const { resumoCheckout } = await import("../../src/modules/orders");
  const unica = await obraPublicada("resumo-unica", "4.800,00", 1);
  const tiragem = await obraPublicada("resumo-tiragem", "99,90", 3);
  const lucas = await novoCliente("lucas@pbi26.test");
  await noCarrinho(lucas, [
    [unica, 1],
    [tiragem, 2],
  ]);

  expect(await resumoCheckout(lucas)).toMatchObject({
    ok: true,
    dados: {
      itens: [
        { obraId: unica, titulo: "Obra resumo-unica", quantidade: 1, precoCentavos: 480000 },
        { obraId: tiragem, titulo: "Obra resumo-tiragem", quantidade: 2, precoCentavos: 9990 },
      ],
      endereco: {
        destinatario: "Lucas Silveira",
        cep: "01327-000",
        logradouro: "Rua Treze de Maio",
        numero: "450",
        complemento: "Apto 82",
        bairro: "Bela Vista",
        cidade: "São Paulo",
        uf: "SP",
      },
      modalidade: "RETIRADA",
      subtotalCentavos: 499980,
      freteCentavos: 0,
      totalCentavos: 499980,
    },
  });
});

async function sessaoDe(email: string): Promise<string> {
  const { rows } = await db.query(
    'SELECT s.id FROM session s JOIN "user" u ON u.id = s.user_id WHERE u.email = $1',
    [email],
  );
  return rows[0].id;
}

it("RF12/RN01/RN02 recusa visitante, carrinho vazio, obra indisponível ou presa e endereço ausente ou inválido", async () => {
  const { resumoCheckout, reservarItens } = await import("../../src/modules/orders");
  const visitante = { cabecalhos: new Headers(), tokenVisitante: null };
  expect(await resumoCheckout(visitante)).toMatchObject({ ok: false, erro: "nao_autenticado" });

  const vazio = await novoCliente("vazio@pbi26.test");
  expect(await resumoCheckout(vazio)).toMatchObject({ ok: false, erro: "carrinho_vazio" });

  // Obras que estavam à venda quando entraram no carrinho e deixaram de estar.
  const despublicada = await obraPublicada("bloqueio-rascunho", "100,00", 1);
  const arquivada = await obraPublicada("bloqueio-arquivada", "100,00", 1);
  const disputada = await obraPublicada("bloqueio-disputada", "100,00", 1);
  const livre = await obraPublicada("bloqueio-livre", "100,00", 2);
  const bruno = await novoCliente("bruno@pbi26.test");
  await noCarrinho(bruno, [
    [despublicada, 1],
    [arquivada, 1],
    [disputada, 1],
    [livre, 2],
  ]);
  await db.query("UPDATE artwork SET situacao = 'RASCUNHO' WHERE id = $1", [despublicada]);
  await db.query("UPDATE artwork SET excluido_em = now() WHERE id = $1", [arquivada]);
  await novoCliente("carla@pbi26.test");
  expect(
    await reservarItens(await sessaoDe("carla@pbi26.test"), [{ obraId: disputada, quantidade: 1 }]),
  ).toMatchObject({ ok: true });

  const resumo = await resumoCheckout(bruno);
  expect(resumo).toMatchObject({ ok: false, erro: "indisponivel" });
  if (resumo.ok || resumo.erro !== "indisponivel") throw new Error("esperado indisponivel");
  expect([...resumo.obras].sort()).toEqual([despublicada, arquivada, disputada].sort());

  const semEndereco = await novoCliente("sem-endereco@pbi26.test", false);
  await noCarrinho(semEndereco, [[livre, 1]]);
  expect(await resumoCheckout(semEndereco)).toMatchObject({ ok: false, erro: "sem_endereco" });

  const enderecoRuim = await novoCliente("endereco-ruim@pbi26.test");
  await noCarrinho(enderecoRuim, [[livre, 1]]);
  await db.query(
    "UPDATE address SET cep = '123' WHERE user_id = (SELECT id FROM \"user\" WHERE email = $1)",
    ["endereco-ruim@pbi26.test"],
  );
  expect(await resumoCheckout(enderecoRuim)).toMatchObject({ ok: false, erro: "sem_endereco" });
});

it("RF12/RN07 finalizar cria o pedido pendente com cópias imutáveis, ligado à sessão e à reserva de 10 minutos", async () => {
  const { finalizarCompra } = await import("../../src/modules/orders");
  const { salvarEndereco } = await import("../../src/lib/endereco");
  const quadro = await obraPublicada("pedido-quadro", "1.250,00", 1);
  const zine = await obraPublicada("pedido-zine", "35,50", 5);
  const dani = await novoCliente("dani@pbi26.test");
  await noCarrinho(dani, [
    [quadro, 1],
    [zine, 3],
  ]);
  const agora = new Date();

  const resultado = await finalizarCompra({ modalidade: "RETIRADA" }, dani, { agora });
  expect(resultado).toMatchObject({
    ok: true,
    dados: { expiraEm: new Date(agora.getTime() + 10 * 60 * 1000) },
  });
  if (!resultado.ok) throw new Error(resultado.mensagem);
  const { numero } = resultado.dados;
  expect(numero).toMatch(/^\d{8}-[2-9A-HJKMNP-Z]{6}$/);

  const sessao = await sessaoDe("dani@pbi26.test");
  const pedido = async () => {
    const { rows } = await db.query(
      `SELECT o.situacao, o.session_id, o.modalidade_entrega, o.subtotal_centavos, o.desconto_centavos,
              o.frete_centavos, o.total_centavos, o.endereco_copia, u.email
         FROM "order" o JOIN "user" u ON u.id = o.user_id WHERE o.numero = $1`,
      [numero],
    );
    const itens = await db.query(
      `SELECT i.artwork_id, i.titulo_copia, i.preco_centavos_copia, i.quantidade
         FROM order_item i JOIN "order" o ON o.id = i.order_id
        WHERE o.numero = $1 ORDER BY i.preco_centavos_copia DESC`,
      [numero],
    );
    return { ...rows[0], itens: itens.rows };
  };
  const esperado = {
    situacao: "PENDENTE",
    session_id: sessao,
    modalidade_entrega: "RETIRADA",
    subtotal_centavos: 135650,
    desconto_centavos: 0,
    frete_centavos: 0,
    total_centavos: 135650,
    endereco_copia: {
      destinatario: "Lucas Silveira",
      cep: "01327-000",
      logradouro: "Rua Treze de Maio",
      numero: "450",
      complemento: "Apto 82",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      uf: "SP",
    },
    email: "dani@pbi26.test",
    itens: [
      {
        artwork_id: quadro,
        titulo_copia: "Obra pedido-quadro",
        preco_centavos_copia: 125000,
        quantidade: 1,
      },
      {
        artwork_id: zine,
        titulo_copia: "Obra pedido-zine",
        preco_centavos_copia: 3550,
        quantidade: 3,
      },
    ],
  };
  expect(await pedido()).toEqual(esperado);

  const reservas = await db.query(
    "SELECT artwork_id, quantidade, expira_em FROM artwork_reservation WHERE session_id = $1 ORDER BY quantidade",
    [sessao],
  );
  expect(reservas.rows).toEqual([
    { artwork_id: quadro, quantidade: 1, expira_em: new Date(agora.getTime() + 10 * 60 * 1000) },
    { artwork_id: zine, quantidade: 3, expira_em: new Date(agora.getTime() + 10 * 60 * 1000) },
  ]);

  // Mudanças depois da compra não reescrevem o pedido.
  await db.query("UPDATE artwork SET titulo = 'Outro título', preco_centavos = 1 WHERE id = $1", [
    quadro,
  ]);
  expect(await salvarEndereco({ ...ENDERECO, logradouro: "Rua Nova" }, dani.cabecalhos)).toEqual({
    ok: true,
  });
  expect(await pedido()).toEqual(esperado);
});

async function rastrosDe(email: string) {
  const pedidos = await db.query(
    'SELECT o.id FROM "order" o JOIN "user" u ON u.id = o.user_id WHERE u.email = $1',
    [email],
  );
  const reservas = await db.query(
    `SELECT r.id FROM artwork_reservation r JOIN session s ON s.id = r.session_id
       JOIN "user" u ON u.id = s.user_id WHERE u.email = $1`,
    [email],
  );
  return { pedidos: pedidos.rowCount, reservas: reservas.rowCount };
}

it("RF12/RN07 finalizar recusado não deixa pedido nem reserva, e valores enviados pelo navegador são ignorados", async () => {
  const { finalizarCompra, reservarItens } = await import("../../src/modules/orders");
  const RETIRADA = { modalidade: "RETIRADA" };
  expect(
    await finalizarCompra(RETIRADA, { cabecalhos: new Headers(), tokenVisitante: null }),
  ).toMatchObject({ ok: false, erro: "nao_autenticado" });

  const presa = await obraPublicada("recusa-presa", "300,00", 1);
  const tiragem = await obraPublicada("recusa-tiragem", "80,00", 4);
  const vazio = await novoCliente("recusa-vazio@pbi26.test");
  const disputa = await novoCliente("recusa-disputa@pbi26.test");
  const semEndereco = await novoCliente("recusa-sem-endereco@pbi26.test", false);
  await noCarrinho(disputa, [[presa, 1]]);
  await noCarrinho(semEndereco, [[tiragem, 1]]);
  await novoCliente("recusa-dona@pbi26.test");
  await reservarItens(await sessaoDe("recusa-dona@pbi26.test"), [{ obraId: presa, quantidade: 1 }]);

  expect(await finalizarCompra(RETIRADA, vazio)).toMatchObject({
    ok: false,
    erro: "carrinho_vazio",
  });
  expect(await finalizarCompra(RETIRADA, disputa)).toMatchObject({
    ok: false,
    erro: "indisponivel",
    obras: [presa],
  });
  expect(await finalizarCompra(RETIRADA, semEndereco)).toMatchObject({
    ok: false,
    erro: "sem_endereco",
  });
  for (const email of ["recusa-vazio", "recusa-disputa", "recusa-sem-endereco"])
    expect(await rastrosDe(`${email}@pbi26.test`), email).toEqual({ pedidos: 0, reservas: 0 });

  const esperta = await novoCliente("recusa-esperta@pbi26.test");
  await noCarrinho(esperta, [[tiragem, 2]]);
  for (const entrada of [{ modalidade: "ENTREGA" }, {}, null, "RETIRADA"])
    expect(await finalizarCompra(entrada, esperta), JSON.stringify(entrada)).toMatchObject({
      ok: false,
      erro: "invalido",
    });
  expect(await rastrosDe("recusa-esperta@pbi26.test")).toEqual({ pedidos: 0, reservas: 0 });

  const adulterada = await finalizarCompra(
    {
      modalidade: "RETIRADA",
      totalCentavos: 1,
      subtotalCentavos: 1,
      freteCentavos: -500,
      itens: [{ obraId: tiragem, quantidade: 4, precoCentavos: 1 }],
      endereco: { logradouro: "Rua Falsa" },
    },
    esperta,
  );
  if (!adulterada.ok) throw new Error(adulterada.mensagem);
  const { rows } = await db.query(
    `SELECT o.subtotal_centavos, o.frete_centavos, o.total_centavos, o.endereco_copia->>'logradouro' AS rua,
            i.quantidade, i.preco_centavos_copia
       FROM "order" o JOIN order_item i ON i.order_id = o.id WHERE o.numero = $1`,
    [adulterada.dados.numero],
  );
  expect(rows).toEqual([
    {
      subtotal_centavos: 16000,
      frete_centavos: 0,
      total_centavos: 16000,
      rua: "Rua Treze de Maio",
      quantidade: 2,
      preco_centavos_copia: 8000,
    },
  ]);
});

async function pedidosDe(email: string) {
  const { rows } = await db.query(
    `SELECT o.numero, o.situacao, o.session_id FROM "order" o JOIN "user" u ON u.id = o.user_id
      WHERE u.email = $1 ORDER BY o.criado_em`,
    [email],
  );
  return rows;
}

it("RF12 novo finalizar cancela o pedido pendente abandonado, inclusive de outra sessão, e libera a reserva dele", async () => {
  const { finalizarCompra } = await import("../../src/modules/orders");
  const { abrirSessao } = await import("../../src/lib/auth");
  const RETIRADA = { modalidade: "RETIRADA" };
  const gravura = await obraPublicada("troca-gravura", "500,00", 1);
  const adesivo = await obraPublicada("troca-adesivo", "12,00", 10);
  const email = "eva@pbi26.test";
  const notebook = await novoCliente(email);
  const sessaoNotebook = await sessaoDe(email);

  await noCarrinho(notebook, [[gravura, 1]]);
  const primeiro = await finalizarCompra(RETIRADA, notebook);
  if (!primeiro.ok) throw new Error(primeiro.mensagem);
  await noCarrinho(notebook, [[adesivo, 2]]);
  const segundo = await finalizarCompra(RETIRADA, notebook);
  if (!segundo.ok) throw new Error(segundo.mensagem);
  expect(await pedidosDe(email)).toEqual([
    { numero: primeiro.dados.numero, situacao: "CANCELADO", session_id: sessaoNotebook },
    { numero: segundo.dados.numero, situacao: "PENDENTE", session_id: sessaoNotebook },
  ]);

  // A mesma conta entra no celular e finaliza de lá: o pedido do notebook é cancelado e a
  // reserva que ele segurava sai, para a peça não ficar presa duas vezes.
  const celular = {
    cabecalhos: await comCookie((await abrirSessao({ email, senha: SENHA })).token),
    tokenVisitante: null,
  };
  const terceiro = await finalizarCompra(RETIRADA, celular);
  if (!terceiro.ok) throw new Error(terceiro.mensagem);
  const pedidos = await pedidosDe(email);
  expect(pedidos.map((p) => p.situacao)).toEqual(["CANCELADO", "CANCELADO", "PENDENTE"]);
  const sessaoCelular = pedidos[2].session_id;
  expect(sessaoCelular).not.toBe(sessaoNotebook);
  const reservas = await db.query(
    "SELECT session_id, artwork_id, quantidade FROM artwork_reservation WHERE artwork_id = ANY($1::uuid[]) ORDER BY quantidade",
    [[gravura, adesivo]],
  );
  expect(reservas.rows).toEqual([
    { session_id: sessaoCelular, artwork_id: gravura, quantidade: 1 },
    { session_id: sessaoCelular, artwork_id: adesivo, quantidade: 2 },
  ]);
});

it("RN06 com Pix ou boleto em aberto, finalizar leva ao pedido existente sem criar outro nem mexer na reserva", async () => {
  const { finalizarCompra, prorrogarReserva } = await import("../../src/modules/orders");
  const { abrirSessao } = await import("../../src/lib/auth");
  const RETIRADA = { modalidade: "RETIRADA" };
  const mural = await obraPublicada("pix-mural", "2.000,00", 1);
  const email = "fabi@pbi26.test";
  const notebook = await novoCliente(email);
  await noCarrinho(notebook, [[mural, 1]]);
  const pedido = await finalizarCompra(RETIRADA, notebook);
  if (!pedido.ok) throw new Error(pedido.mensagem);
  const { numero } = pedido.dados;

  // O que o PBI-27/28 vai gravar: Pix emitido e reserva prorrogada até o vencimento.
  await db.query(
    `INSERT INTO payment (id, order_id, provedor, metodo, situacao, valor_centavos)
     SELECT gen_random_uuid(), id, 'mercadopago', 'PIX', 'PENDENTE', total_centavos FROM "order" WHERE numero = $1`,
    [numero],
  );
  const vencimento = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const sessao = await sessaoDe(email);
  expect(
    await prorrogarReserva(sessao, [{ obraId: mural, quantidade: 1 }], vencimento),
  ).toMatchObject({ ok: true });

  const celular = {
    cabecalhos: await comCookie((await abrirSessao({ email, senha: SENHA })).token),
    tokenVisitante: null,
  };
  for (const contexto of [notebook, celular])
    expect(await finalizarCompra(RETIRADA, contexto)).toMatchObject({
      ok: false,
      erro: "pendente",
      numero,
    });
  expect(await pedidosDe(email)).toEqual([{ numero, situacao: "PENDENTE", session_id: sessao }]);
  const reservas = await db.query(
    "SELECT session_id, expira_em FROM artwork_reservation WHERE artwork_id = $1",
    [mural],
  );
  expect(reservas.rows).toEqual([{ session_id: sessao, expira_em: vencimento }]);

  // Pagamento recusado não segura o pedido: o próximo finalizar o trata como abandonado.
  await db.query("UPDATE payment SET situacao = 'RECUSADO'");
  const novo = await finalizarCompra(RETIRADA, notebook);
  if (!novo.ok) throw new Error(novo.mensagem);
  expect((await pedidosDe(email)).map((p) => p.situacao)).toEqual(["CANCELADO", "PENDENTE"]);
});

it("RN04 cliques simultâneos deixam um só pedido pendente, e dois clientes não compram a mesma peça única", async () => {
  const { finalizarCompra } = await import("../../src/modules/orders");
  const RETIRADA = { modalidade: "RETIRADA" };
  const serigrafia = await obraPublicada("corrida-serigrafia", "640,00", 3);
  const email = "gabi@pbi26.test";
  const gabi = await novoCliente(email);
  await noCarrinho(gabi, [[serigrafia, 2]]);

  for (let rodada = 0; rodada < 5; rodada++) {
    const resultados = await Promise.all(
      Array.from({ length: 4 }, () => finalizarCompra(RETIRADA, gabi)),
    );
    expect(
      resultados.every((r) => r.ok),
      `rodada ${rodada}`,
    ).toBe(true);
    const pendentes = (await pedidosDe(email)).filter((p) => p.situacao === "PENDENTE");
    expect(pendentes, `rodada ${rodada}`).toHaveLength(1);
    const reservas = await db.query(
      "SELECT quantidade FROM artwork_reservation WHERE artwork_id = $1",
      [serigrafia],
    );
    expect(reservas.rows, `rodada ${rodada}`).toEqual([{ quantidade: 2 }]);
  }

  const unica = await obraPublicada("corrida-unica", "9.900,00", 1);
  const rivais = await Promise.all(
    ["rival-1", "rival-2"].map(async (nome) => {
      const contexto = await novoCliente(`${nome}@pbi26.test`);
      await noCarrinho(contexto, [[unica, 1]]);
      return contexto;
    }),
  );
  const disputa = await Promise.all(rivais.map((c) => finalizarCompra(RETIRADA, c)));
  expect(disputa.filter((r) => r.ok)).toHaveLength(1);
  expect(disputa.filter((r) => !r.ok)).toMatchObject([
    { ok: false, erro: "indisponivel", obras: [unica] },
  ]);
  const vendidos = await db.query(
    "SELECT count(*)::int AS pedidos FROM order_item WHERE artwork_id = $1",
    [unica],
  );
  expect(vendidos.rows).toEqual([{ pedidos: 1 }]);
});

it("RF12 número repetido tenta de novo; se não sair, nada fica gravado (nem pedido nem reserva)", async () => {
  const { finalizarCompra } = await import("../../src/modules/orders");
  const RETIRADA = { modalidade: "RETIRADA" };
  const lambe = await obraPublicada("colisao-lambe", "45,00", 2);
  const ivo = await novoCliente("ivo@pbi26.test");
  await noCarrinho(ivo, [[lambe, 1]]);
  const existente = await finalizarCompra(RETIRADA, ivo);
  if (!existente.ok) throw new Error(existente.mensagem);
  const repetido = existente.dados.numero;

  const email = "heitor@pbi26.test";
  const heitor = await novoCliente(email);
  await noCarrinho(heitor, [[lambe, 1]]);
  expect(await finalizarCompra(RETIRADA, heitor, { gerarNumero: () => repetido })).toMatchObject({
    ok: false,
    erro: "falha",
  });
  expect(await rastrosDe(email)).toEqual({ pedidos: 0, reservas: 0 });

  const numeros = [repetido, repetido, "20991231-ZZZZZZ"];
  const sorteio = await finalizarCompra(RETIRADA, heitor, {
    gerarNumero: () => numeros.shift() ?? "nunca",
  });
  expect(sorteio).toMatchObject({ ok: true, dados: { numero: "20991231-ZZZZZZ" } });
  expect(await rastrosDe(email)).toEqual({ pedidos: 1, reservas: 1 });
});
