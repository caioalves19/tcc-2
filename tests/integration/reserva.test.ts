import type { Client } from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";
import { prepararContas } from "./contas-pbi17";

let db: Client;
let admin: Headers;
let idAna: string;
let sessaoCliente: string;
let sessaoAna: string;

beforeAll(async () => {
  ({ db, admin, idAna } = await prepararContas("kolo_pbi25_reserva_test"));
  const sessao = async (email: string): Promise<string> => {
    const { rows } = await db.query(
      'SELECT s.id FROM session s JOIN "user" u ON u.id = s.user_id WHERE u.email = $1 LIMIT 1',
      [email],
    );
    return rows[0].id;
  };
  sessaoCliente = await sessao("cliente@pbi17.test");
  sessaoAna = await sessao("ana@pbi17.test");
}, 120_000);
afterAll(async () => {
  await db?.end();
});

// Obra pronta para venda: cadastrada, com imagem e publicada pelo catálogo do PBI-18.
async function obraPublicada(slug: string, estoque: number) {
  const { criarObra, editarObra } = await import("../../src/modules/catalog");
  const ficha = {
    titulo: `Obra ${slug}`,
    slug,
    artistaId: idAna,
    preco: "100,00",
    estoque: String(estoque),
  };
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

const T0 = new Date("2026-10-08T12:00:00.000Z");

it("RN02/RN03 reserva até o estoque livre e recusa o que já está reservado por outra sessão", async () => {
  const { reservarItens } = await import("../../src/modules/orders");
  const tiragem = await obraPublicada("t1-tiragem", 3);

  expect(await reservarItens(sessaoCliente, [{ obraId: tiragem, quantidade: 2 }], T0)).toEqual({
    ok: true,
    dados: { expiraEm: new Date("2026-10-08T12:10:00.000Z") },
  });
  expect(await reservarItens(sessaoAna, [{ obraId: tiragem, quantidade: 2 }], T0)).toMatchObject({
    ok: false,
    erro: "indisponivel",
    obras: [tiragem],
  });
  expect(await reservarItens(sessaoAna, [{ obraId: tiragem, quantidade: 1 }], T0)).toMatchObject({
    ok: true,
  });
  const { rows } = await db.query(
    "SELECT quantidade FROM artwork_reservation WHERE artwork_id = $1 ORDER BY quantidade",
    [tiragem],
  );
  expect(rows).toEqual([{ quantidade: 1 }, { quantidade: 2 }]);
  // Reservar não baixa estoque: a baixa só vem com o pagamento aprovado.
  const estoque = await db.query("SELECT quantidade_estoque FROM artwork WHERE id = $1", [tiragem]);
  expect(estoque.rows[0].quantidade_estoque).toBe(3);
});

it("RN11 obra em rascunho ou arquivada não é reservada", async () => {
  const { reservarItens } = await import("../../src/modules/orders");
  const rascunho = await obraPublicada("t1-rascunho", 1);
  await db.query("UPDATE artwork SET situacao = 'RASCUNHO' WHERE id = $1", [rascunho]);
  const arquivada = await obraPublicada("t1-arquivada", 1);
  await db.query("UPDATE artwork SET excluido_em = now() WHERE id = $1", [arquivada]);

  expect(
    await reservarItens(
      sessaoCliente,
      [
        { obraId: rascunho, quantidade: 1 },
        { obraId: arquivada, quantidade: 1 },
      ],
      T0,
    ),
  ).toMatchObject({ ok: false, erro: "indisponivel", obras: [rascunho, arquivada].sort() });
});

// Sessões extras do cliente, como abas/aparelhos diferentes disputando a mesma peça.
async function novasSessoes(quantas: number): Promise<string[]> {
  const { rows } = await db.query(
    `INSERT INTO session (id, user_id, token, expira_em, atualizado_em)
     SELECT gen_random_uuid(), u.id, gen_random_uuid()::text, now() + interval '1 day', now()
     FROM "user" u, generate_series(1, $1) WHERE u.email = 'cliente@pbi17.test'
     RETURNING id`,
    [quantas],
  );
  return rows.map((r) => r.id);
}

it("RN04 reservas concorrentes de uma peça única: só uma leva", async () => {
  const { reservarItens } = await import("../../src/modules/orders");
  const sessoes = await novasSessoes(8);

  // Várias rodadas para a disputa não depender da sorte de uma só.
  for (let rodada = 0; rodada < 10; rodada++) {
    const unica = await obraPublicada(`t2-unica-${rodada}`, 1);
    const resultados = await Promise.all(
      sessoes.map((s) => reservarItens(s, [{ obraId: unica, quantidade: 1 }], T0)),
    );
    expect(resultados.filter((r) => r.ok)).toHaveLength(1);
    const { rows } = await db.query(
      "SELECT COALESCE(SUM(quantidade), 0)::int AS total FROM artwork_reservation WHERE artwork_id = $1",
      [unica],
    );
    expect(rows[0].total).toBe(1);
  }
});

it("RN03 a reserva vence em 10 minutos e uma nova da mesma sessão substitui a anterior", async () => {
  const { reservarItens } = await import("../../src/modules/orders");
  const unica = await obraPublicada("t3-unica", 1);
  const outra = await obraPublicada("t3-outra", 1);
  const [primeira, segunda] = (await novasSessoes(2)) as [string, string];
  const depois = (ms: number) => new Date(T0.getTime() + ms);

  expect(await reservarItens(primeira, [{ obraId: unica, quantidade: 1 }], T0)).toMatchObject({
    ok: true,
  });
  expect(
    await reservarItens(segunda, [{ obraId: unica, quantidade: 1 }], depois(10 * 60_000 - 1)),
  ).toMatchObject({ ok: false, erro: "indisponivel" });
  expect(
    await reservarItens(segunda, [{ obraId: unica, quantidade: 1 }], depois(10 * 60_000 + 1)),
  ).toMatchObject({ ok: true });

  // A primeira sessão volta ao checkout com outro carrinho: a reserva antiga sai.
  expect(
    await reservarItens(primeira, [{ obraId: outra, quantidade: 1 }], depois(11 * 60_000)),
  ).toMatchObject({ ok: true });
  const { rows } = await db.query(
    "SELECT artwork_id FROM artwork_reservation WHERE session_id = $1",
    [primeira],
  );
  expect(rows).toEqual([{ artwork_id: outra }]);
});

it("RN06 com Pix/boleto pendente a reserva ativa é prorrogada; a vencida não volta", async () => {
  const { prorrogarReserva, reservarItens } = await import("../../src/modules/orders");
  const unica = await obraPublicada("t4-unica", 1);
  const tardia = await obraPublicada("t4-tardia", 1);
  const [pix, concorrente, atrasada] = (await novasSessoes(3)) as [string, string, string];
  const depois = (min: number) => new Date(T0.getTime() + min * 60_000);
  const vencimentoPix = depois(30);

  await reservarItens(pix, [{ obraId: unica, quantidade: 1 }], T0);
  expect(
    await prorrogarReserva(pix, [{ obraId: unica, quantidade: 1 }], vencimentoPix, depois(5)),
  ).toEqual({
    ok: true,
    dados: { expiraEm: vencimentoPix },
  });
  expect(
    await reservarItens(concorrente, [{ obraId: unica, quantidade: 1 }], depois(20)),
  ).toMatchObject({ ok: false, erro: "indisponivel" });

  await reservarItens(atrasada, [{ obraId: tardia, quantidade: 1 }], T0);
  expect(
    await prorrogarReserva(
      atrasada,
      [{ obraId: tardia, quantidade: 1 }],
      vencimentoPix,
      depois(11),
    ),
  ).toEqual({
    ok: false,
    erro: "sem_reserva",
  });
});

it("RN03 a limpeza apaga só reservas vencidas e pode rodar de novo sem efeito", async () => {
  const { liberarReservasExpiradas, reservarItens } = await import("../../src/modules/orders");
  const vencida = await obraPublicada("t5-vencida", 1);
  const ativa = await obraPublicada("t5-ativa", 1);
  const [antiga, recente] = (await novasSessoes(2)) as [string, string];
  const limpeza = new Date("2026-10-08T13:00:00.000Z");

  await reservarItens(antiga, [{ obraId: vencida, quantidade: 1 }], T0);
  await reservarItens(
    recente,
    [{ obraId: ativa, quantidade: 1 }],
    new Date("2026-10-08T12:55:00.000Z"),
  );

  expect(await liberarReservasExpiradas(limpeza)).toBeGreaterThanOrEqual(1);
  expect(await liberarReservasExpiradas(limpeza)).toBe(0);
  const { rows } = await db.query(
    "SELECT artwork_id FROM artwork_reservation WHERE artwork_id = ANY($1::uuid[])",
    [[vencida, ativa]],
  );
  expect(rows).toEqual([{ artwork_id: ativa }]);
});

it("RF15 o estoque livre desconta reservas ativas e volta quando a sessão desiste", async () => {
  const { estoqueDisponivel, liberarReservas, reservarItens } =
    await import("../../src/modules/orders");
  const tiragem = await obraPublicada("t5-tiragem", 3);
  const rascunho = await obraPublicada("t5-rascunho", 2);
  await db.query("UPDATE artwork SET situacao = 'RASCUNHO' WHERE id = $1", [rascunho]);
  const [sessao] = (await novasSessoes(1)) as [string];

  expect(await estoqueDisponivel(tiragem, T0)).toBe(3);
  await reservarItens(sessao, [{ obraId: tiragem, quantidade: 2 }], T0);
  expect(await estoqueDisponivel(tiragem, T0)).toBe(1);
  expect(await estoqueDisponivel(tiragem, new Date(T0.getTime() + 10 * 60_000))).toBe(3);

  await liberarReservas(sessao);
  expect(await estoqueDisponivel(tiragem, T0)).toBe(3);
  expect(await estoqueDisponivel(rascunho, T0)).toBe(0);
});

it("RN05/RN11 pagamento aprovado com reserva ativa baixa o estoque e esgota a peça", async () => {
  const { baixarEstoque, reservarItens } = await import("../../src/modules/orders");
  const unica = await obraPublicada("t6-unica", 1);
  const [sessao] = (await novasSessoes(1)) as [string];
  await reservarItens(sessao, [{ obraId: unica, quantidade: 1 }], T0);

  expect(
    await baixarEstoque(
      sessao,
      [{ obraId: unica, quantidade: 1 }],
      new Date(T0.getTime() + 60_000),
    ),
  ).toEqual({ ok: true });
  const obra = await db.query("SELECT quantidade_estoque, situacao FROM artwork WHERE id = $1", [
    unica,
  ]);
  expect(obra.rows).toEqual([{ quantidade_estoque: 0, situacao: "ESGOTADA" }]);
  const reservas = await db.query("SELECT 1 FROM artwork_reservation WHERE artwork_id = $1", [
    unica,
  ]);
  expect(reservas.rowCount).toBe(0);
});

it("RN06 aprovação depois da reserva vencida: baixa se sobrou unidade, senão sem_estoque", async () => {
  const { baixarEstoque, reservarItens } = await import("../../src/modules/orders");
  const sobrou = await obraPublicada("t6-sobrou", 1);
  const tomada = await obraPublicada("t6-tomada", 1);
  const [atrasada, outra] = (await novasSessoes(2)) as [string, string];
  const depois = (min: number) => new Date(T0.getTime() + min * 60_000);

  await reservarItens(atrasada, [{ obraId: sobrou, quantidade: 1 }], T0);
  expect(await baixarEstoque(atrasada, [{ obraId: sobrou, quantidade: 1 }], depois(15))).toEqual({
    ok: true,
  });

  await reservarItens(atrasada, [{ obraId: tomada, quantidade: 1 }], T0);
  await reservarItens(outra, [{ obraId: tomada, quantidade: 1 }], depois(12));
  // Sessão apagada (logout) cai no mesmo caminho: sessaoId null.
  for (const sessao of [atrasada, null]) {
    expect(await baixarEstoque(sessao, [{ obraId: tomada, quantidade: 1 }], depois(15))).toEqual({
      ok: false,
      erro: "sem_estoque",
      obras: [tomada],
    });
  }
  const { rows } = await db.query(
    "SELECT id, quantidade_estoque FROM artwork WHERE id = ANY($1::uuid[]) ORDER BY titulo",
    [[sobrou, tomada]],
  );
  expect(rows).toEqual([
    { id: sobrou, quantidade_estoque: 0 },
    { id: tomada, quantidade_estoque: 1 },
  ]);
});

it("RN06 a prorrogação não encurta nem libera a reserva por engano", async () => {
  const { prorrogarReserva, reservarItens } = await import("../../src/modules/orders");
  const unica = await obraPublicada("t4-validacao", 1);
  const [pix, concorrente] = (await novasSessoes(2)) as [string, string];
  const depois = (min: number) => new Date(T0.getTime() + min * 60_000);

  await reservarItens(pix, [{ obraId: unica, quantidade: 1 }], T0);
  // depois(8) está no futuro, mas antes do vencimento atual (depois(10)): encurtaria a reserva.
  for (const ate of [depois(-1), depois(2), depois(5), depois(8), new Date(Number.NaN)]) {
    expect(
      await prorrogarReserva(pix, [{ obraId: unica, quantidade: 1 }], ate, depois(5)),
    ).toMatchObject({
      ok: false,
      erro: "invalido",
    });
  }
  // Itens do pedido inválidos também não mexem na reserva.
  expect(await prorrogarReserva(pix, [], depois(30), depois(5))).toMatchObject({
    ok: false,
    erro: "invalido",
  });
  expect(
    await reservarItens(concorrente, [{ obraId: unica, quantidade: 1 }], depois(9)),
  ).toMatchObject({ ok: false, erro: "indisponivel" });
});

it("RNF11 a baixa entra na transação do webhook e é desfeita junto com ela", async () => {
  const { baixarEstoque, reservarItens } = await import("../../src/modules/orders");
  const { obterPrisma } = await import("../../src/lib/prisma");
  const tiragem = await obraPublicada("t6-transacao", 2);
  const [sessao] = (await novasSessoes(1)) as [string];
  await reservarItens(sessao, [{ obraId: tiragem, quantidade: 1 }], T0);

  await expect(
    obterPrisma().$transaction(async (tx) => {
      const baixa = await baixarEstoque(sessao, [{ obraId: tiragem, quantidade: 1 }], T0, tx);
      expect(baixa).toEqual({ ok: true });
      throw new Error("falha depois da baixa, antes de gravar o evento");
    }),
  ).rejects.toThrow("falha depois da baixa");

  const obra = await db.query("SELECT quantidade_estoque FROM artwork WHERE id = $1", [tiragem]);
  expect(obra.rows).toEqual([{ quantidade_estoque: 2 }]);
  const reservas = await db.query("SELECT 1 FROM artwork_reservation WHERE session_id = $1", [
    sessao,
  ]);
  expect(reservas.rowCount).toBe(1);
});

it("RN04 tudo ou nada: uma obra que não cabe derruba a reserva e a baixa inteiras", async () => {
  const { baixarEstoque, reservarItens } = await import("../../src/modules/orders");
  const cabe = await obraPublicada("t8-cabe", 2);
  const naoCabe = await obraPublicada("t8-nao-cabe", 1);
  const [sessao] = (await novasSessoes(1)) as [string];
  const itens = [
    { obraId: cabe, quantidade: 1 },
    { obraId: naoCabe, quantidade: 2 },
  ];

  expect(await reservarItens(sessao, itens, T0)).toEqual({
    ok: false,
    erro: "indisponivel",
    obras: [naoCabe],
  });
  expect(await baixarEstoque(sessao, itens, T0)).toEqual({
    ok: false,
    erro: "sem_estoque",
    obras: [naoCabe],
  });
  const reservas = await db.query("SELECT 1 FROM artwork_reservation WHERE session_id = $1", [
    sessao,
  ]);
  expect(reservas.rowCount).toBe(0);
  const { rows } = await db.query(
    "SELECT slug, quantidade_estoque FROM artwork WHERE id = ANY($1::uuid[]) ORDER BY slug",
    [[cabe, naoCabe]],
  );
  expect(rows).toEqual([
    { slug: "t8-cabe", quantidade_estoque: 2 },
    { slug: "t8-nao-cabe", quantidade_estoque: 1 },
  ]);
});

it("RN11 a baixa de uma obra que voltou a rascunho não a publica de novo", async () => {
  const { baixarEstoque, reservarItens } = await import("../../src/modules/orders");
  const obra = await obraPublicada("t8-rascunho", 2);
  const [sessao] = (await novasSessoes(1)) as [string];
  await reservarItens(sessao, [{ obraId: obra, quantidade: 1 }], T0);
  await db.query("UPDATE artwork SET situacao = 'RASCUNHO' WHERE id = $1", [obra]);

  expect(await baixarEstoque(sessao, [{ obraId: obra, quantidade: 1 }], T0)).toEqual({ ok: true });
  const { rows } = await db.query(
    "SELECT quantidade_estoque, situacao FROM artwork WHERE id = $1",
    [obra],
  );
  expect(rows).toEqual([{ quantidade_estoque: 1, situacao: "RASCUNHO" }]);
});

it("RN04 carrinhos com as mesmas obras em ordem invertida não travam um ao outro", async () => {
  const { reservarItens } = await import("../../src/modules/orders");
  const sessoes = await novasSessoes(8);

  for (let rodada = 0; rodada < 5; rodada++) {
    const a = await obraPublicada(`t8-a-${rodada}`, 1);
    const b = await obraPublicada(`t8-b-${rodada}`, 1);
    const resultados = await Promise.all(
      sessoes.map((s, i) =>
        reservarItens(
          s,
          i % 2 === 0
            ? [
                { obraId: a, quantidade: 1 },
                { obraId: b, quantidade: 1 },
              ]
            : [
                { obraId: b, quantidade: 1 },
                { obraId: a, quantidade: 1 },
              ],
          T0,
        ),
      ),
    );
    expect(resultados.filter((r) => r.ok)).toHaveLength(1);
  }
});

it("RF15 o dono da reserva vê as próprias unidades como livres; id em maiúsculas vale igual", async () => {
  const { baixarEstoque, estoqueDisponivel, reservarItens } =
    await import("../../src/modules/orders");
  const tiragem = await obraPublicada("t9-tiragem", 3);
  const [dono] = (await novasSessoes(1)) as [string];
  await reservarItens(dono, [{ obraId: tiragem.toUpperCase(), quantidade: 2 }], T0);

  expect(await estoqueDisponivel(tiragem, T0)).toBe(1);
  expect(await estoqueDisponivel(tiragem, T0, dono)).toBe(3);
  expect(await baixarEstoque(dono, [{ obraId: tiragem.toUpperCase(), quantidade: 2 }], T0)).toEqual(
    { ok: true },
  );
});

it("RN06 com Pix/boleto pendente, um novo checkout da mesma sessão não derruba a reserva", async () => {
  const { liberarReservas, prorrogarReserva, reservarItens } =
    await import("../../src/modules/orders");
  const doPix = await obraPublicada("t10-pix", 1);
  const outra = await obraPublicada("t10-outra", 1);
  const [cliente, concorrente] = (await novasSessoes(2)) as [string, string];
  const depois = (min: number) => new Date(T0.getTime() + min * 60_000);

  await reservarItens(cliente, [{ obraId: doPix, quantidade: 1 }], T0);
  await prorrogarReserva(cliente, [{ obraId: doPix, quantidade: 1 }], depois(30), depois(1));

  expect(await reservarItens(cliente, [{ obraId: outra, quantidade: 1 }], depois(5))).toEqual({
    ok: false,
    erro: "pendente",
  });
  expect(
    await reservarItens(concorrente, [{ obraId: doPix, quantidade: 1 }], depois(15)),
  ).toMatchObject({ ok: false, erro: "indisponivel" });

  // Pedido cancelado antes de pagar: as unidades voltam e a sessão pode reservar de novo.
  await liberarReservas(cliente);
  expect(
    await reservarItens(cliente, [{ obraId: outra, quantidade: 1 }], depois(16)),
  ).toMatchObject({ ok: true });
});

it("RN04/RN06 prorrogação que chega depois de outra sessão tomar a peça não a duplica", async () => {
  const { prorrogarReserva, reservarItens } = await import("../../src/modules/orders");
  const unica = await obraPublicada("t11-virada", 1);
  const [pix, concorrente] = (await novasSessoes(2)) as [string, string];
  const depois = (ms: number) => new Date(T0.getTime() + ms);

  await reservarItens(pix, [{ obraId: unica, quantidade: 1 }], T0);
  // Pelo relógio da concorrente, a reserva do Pix já venceu; ela trava e leva a peça primeiro.
  expect(
    await reservarItens(concorrente, [{ obraId: unica, quantidade: 1 }], depois(10 * 60_000 + 1)),
  ).toMatchObject({ ok: true });
  // A prorrogação chega depois, com um relógio de antes da virada.
  expect(
    await prorrogarReserva(
      pix,
      [{ obraId: unica, quantidade: 1 }],
      depois(30 * 60_000),
      depois(9 * 60_000),
    ),
  ).toEqual({
    ok: false,
    erro: "sem_reserva",
  });
  const { rows } = await db.query(
    "SELECT COALESCE(SUM(quantidade), 0)::int AS total FROM artwork_reservation WHERE artwork_id = $1 AND expira_em > $2",
    [unica, depois(15 * 60_000)],
  );
  expect(rows[0].total).toBe(1);
});

// Quantas transações deste banco estão paradas esperando uma trava.
async function esperandoTrava(quantas: number, limiteMs = 5_000): Promise<boolean> {
  const fim = Date.now() + limiteMs;
  while (Date.now() < fim) {
    const { rows } = await db.query(
      "SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock'",
    );
    if (rows[0].n >= quantas) return true;
    await new Promise((r) => setTimeout(r, 25));
  }
  return false;
}

it("RN06 checkout e prorrogação simultâneos na mesma sessão: a prorrogação não garante reserva apagada", async () => {
  const { Client } = await import("pg");
  const { prorrogarReserva, reservarItens } = await import("../../src/modules/orders");
  const doPix = await obraPublicada("t12-pix", 1);
  const outra = await obraPublicada("t12-outra", 1);
  const [cliente] = (await novasSessoes(1)) as [string];
  const depois = (min: number) => new Date(T0.getTime() + min * 60_000);
  await reservarItens(cliente, [{ obraId: doPix, quantidade: 1 }], T0);

  // Outra conexão segura a obra do carrinho novo: o checkout passa da checagem de pendente
  // e espera; a prorrogação do Pix chega nesse meio-tempo.
  const trava = new Client({ connectionString: process.env.DATABASE_URL });
  await trava.connect();
  try {
    await trava.query("BEGIN");
    await trava.query("SELECT id FROM artwork WHERE id = $1 FOR UPDATE", [outra]);
    const checkout = reservarItens(cliente, [{ obraId: outra, quantidade: 1 }], depois(2));
    expect(await esperandoTrava(1)).toBe(true);
    const prorrogacao = prorrogarReserva(
      cliente,
      [{ obraId: doPix, quantidade: 1 }],
      depois(30),
      depois(2),
    );
    await Promise.race([prorrogacao, esperandoTrava(2)]);
    await trava.query("COMMIT");

    // O checkout começou antes e trocou o carrinho; a prorrogação chega sem reserva para
    // garantir, e o PBI-27 não emite o Pix.
    expect(await checkout).toMatchObject({ ok: true });
    expect(await prorrogacao).toEqual({ ok: false, erro: "sem_reserva" });
  } finally {
    await trava.end();
  }
  const { rows } = await db.query(
    "SELECT artwork_id FROM artwork_reservation WHERE session_id = $1",
    [cliente],
  );
  expect(rows).toEqual([{ artwork_id: outra }]);
});
