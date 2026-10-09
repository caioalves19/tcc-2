import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { prepararContas } from "./contas-pbi17";

let db: Client;
let admin: Headers;
let cliente: Headers;
let ana: Headers;
let bia: Headers;
let idAna: string;
let idBia: string;
let estiloId: string;
let tamanhoId: string;

beforeAll(async () => {
  ({ db, admin, cliente, ana, bia, idAna, idBia } = await prepararContas("kolo_pbi34_agenda_test"));
  const estilo = await db.query(
    "INSERT INTO tattoo_style (id, nome, slug) VALUES (gen_random_uuid(), 'Fineline', 'fineline') RETURNING id",
  );
  const tamanho = await db.query(
    "INSERT INTO size_tier (id, nome, ordem) VALUES (gen_random_uuid(), 'Médio', 2) RETURNING id",
  );
  estiloId = estilo.rows[0].id;
  tamanhoId = tamanho.rows[0].id;
}, 120_000);
afterAll(async () => {
  await db?.end();
});
// Cada teste começa com a agenda vazia no banco descartável.
beforeEach(async () => {
  await db.query("DELETE FROM appointment");
});

// Horário combinado no WhatsApp, como o artista digita (datetime-local em São Paulo).
const horario = (extra: Record<string, unknown> = {}) => ({
  nomeContato: "Lucas Silveira",
  telefoneContato: "(11) 98765-4321",
  inicio: "2026-10-15T14:00",
  fim: "2026-10-15T17:00",
  ...extra,
});

it("RF22/RN09 o artista cadastra um horário na própria agenda, gravado em UTC", async () => {
  const { cadastrarHorario } = await import("../../src/modules/scheduling");
  const resultado = await cadastrarHorario(
    horario({
      estiloId,
      tamanhoId,
      regiaoCorpo: "Antebraço",
      observacoes: "Fineline; referências no WhatsApp.",
    }),
    ana,
  );
  expect(resultado).toMatchObject({ ok: true });
  if (!resultado.ok) throw new Error(resultado.mensagem);
  expect(resultado.dados.codigo).toMatch(/^AG-\d{8}-[2-9A-HJKMNP-Z]{6}$/);

  const { rows } = await db.query(
    `SELECT codigo, user_id, nome_contato, telefone_contato, artist_id, situacao, inicia_em, termina_em,
            regiao_corpo, descricao, tattoo_style_id, size_tier_id
       FROM appointment WHERE id = $1`,
    [resultado.dados.id],
  );
  expect(rows).toEqual([
    {
      codigo: resultado.dados.codigo,
      user_id: null,
      nome_contato: "Lucas Silveira",
      telefone_contato: "11987654321",
      artist_id: idAna,
      situacao: "AGENDADO",
      inicia_em: new Date("2026-10-15T17:00:00Z"),
      termina_em: new Date("2026-10-15T20:00:00Z"),
      regiao_corpo: "Antebraço",
      descricao: "Fineline; referências no WhatsApp.",
      tattoo_style_id: estiloId,
      size_tier_id: tamanhoId,
    },
  ]);
});

it("RN08 o banco recusa horário sobreposto do mesmo artista; encostado e de outro artista passam", async () => {
  const { cadastrarHorario } = await import("../../src/modules/scheduling");
  expect(await cadastrarHorario(horario(), ana)).toMatchObject({ ok: true });

  expect(
    await cadastrarHorario(horario({ inicio: "2026-10-15T16:00", fim: "2026-10-15T18:00" }), ana),
  ).toEqual({
    ok: false,
    erro: "sobreposto",
    mensagem: "Este artista já tem um horário nesse intervalo.",
  });
  // [início, fim): terminar às 17:00 e começar às 17:00 não se sobrepõem.
  expect(
    await cadastrarHorario(horario({ inicio: "2026-10-15T17:00", fim: "2026-10-15T18:00" }), ana),
  ).toMatchObject({ ok: true });
  expect(await cadastrarHorario(horario(), bia)).toMatchObject({ ok: true });
});

it("RN08 cadastros simultâneos no mesmo intervalo: só um passa", async () => {
  const { cadastrarHorario } = await import("../../src/modules/scheduling");
  const mesmo = horario({ inicio: "2026-10-20T10:00", fim: "2026-10-20T12:00" });
  for (let rodada = 0; rodada < 3; rodada++) {
    await db.query("DELETE FROM appointment");
    const resultados = await Promise.all(
      Array.from({ length: 5 }, () => cadastrarHorario(mesmo, ana)),
    );
    expect(
      resultados.filter((r) => r.ok),
      `rodada ${rodada}`,
    ).toHaveLength(1);
    expect(
      resultados.filter((r) => !r.ok).map((r) => (r.ok ? "" : r.erro)),
      `rodada ${rodada}`,
    ).toEqual(["sobreposto", "sobreposto", "sobreposto", "sobreposto"]);
    const { rows } = await db.query("SELECT count(*)::int AS horarios FROM appointment");
    expect(rows).toEqual([{ horarios: 1 }]);
  }
});

it("RN10 o artista só cadastra na própria agenda; cliente e visitante não acessam; o admin escolhe o artista", async () => {
  const { cadastrarHorario } = await import("../../src/modules/scheduling");
  expect(await cadastrarHorario(horario({ artistaId: idBia }), ana)).toMatchObject({
    ok: false,
    erro: "proibido",
  });
  expect(await cadastrarHorario(horario({ artistaId: idAna }), ana)).toMatchObject({ ok: true });
  expect(await cadastrarHorario(horario(), cliente)).toMatchObject({ ok: false, erro: "proibido" });
  expect(await cadastrarHorario(horario(), new Headers())).toMatchObject({
    ok: false,
    erro: "nao_autenticado",
  });

  expect(await cadastrarHorario(horario({ artistaId: idBia }), admin)).toMatchObject({ ok: true });
  expect(
    await cadastrarHorario(horario({ inicio: "2026-10-16T10:00", fim: "2026-10-16T11:00" }), admin),
  ).toMatchObject({
    ok: false,
    erro: "invalido",
    campos: { artistaId: "Escolha o artista." },
  });
  expect(
    await cadastrarHorario(
      horario({
        artistaId: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d",
        inicio: "2026-10-16T10:00",
        fim: "2026-10-16T11:00",
      }),
      admin,
    ),
  ).toMatchObject({
    ok: false,
    erro: "invalido",
    campos: { artistaId: "Escolha um artista cadastrado." },
  });
  const { rows } = await db.query("SELECT artist_id FROM appointment ORDER BY artist_id");
  expect(rows.map((r) => r.artist_id).sort()).toEqual([idAna, idBia].sort());
});

it("RN10 o papel é relido no banco: artista rebaixado a cliente perde a agenda na hora", async () => {
  const { cadastrarHorario } = await import("../../src/modules/scheduling");
  await db.query("UPDATE \"user\" SET papel = 'CLIENTE' WHERE email = 'ana@pbi17.test'");
  try {
    expect(await cadastrarHorario(horario(), ana)).toMatchObject({ ok: false, erro: "proibido" });
  } finally {
    await db.query("UPDATE \"user\" SET papel = 'ARTISTA' WHERE email = 'ana@pbi17.test'");
  }
});

it("RF22/RN09 valida intervalo, contato, estilo e tamanho, com o erro no campo certo", async () => {
  const { cadastrarHorario } = await import("../../src/modules/scheduling");
  const AUSENTE = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";
  const casos: [Record<string, unknown>, Record<string, string>][] = [
    [{ fim: "2026-10-15T14:00" }, { fim: "O fim precisa ser depois do início." }],
    [{ fim: "2026-10-15T13:00" }, { fim: "O fim precisa ser depois do início." }],
    [{ fim: "2026-10-16T03:00" }, { fim: "A sessão pode ter no máximo 12 horas." }],
    [{ inicio: "amanhã" }, { inicio: "Informe data e hora." }],
    [{ nomeContato: "  " }, { nomeContato: "Informe o nome do contato." }],
    [{ telefoneContato: "9876-5432" }, { telefoneContato: "Informe o telefone com DDD." }],
    [{ estiloId: AUSENTE }, { estiloId: "Escolha um estilo cadastrado." }],
    [{ tamanhoId: AUSENTE }, { tamanhoId: "Escolha um tamanho cadastrado." }],
    [{ emailCliente: "lucas@" }, { emailCliente: "Informe um e-mail válido." }],
  ];
  for (const [extra, campos] of casos)
    expect(await cadastrarHorario(horario(extra), ana), JSON.stringify(extra)).toMatchObject({
      ok: false,
      erro: "invalido",
      campos,
    });
  const { rows } = await db.query("SELECT count(*)::int AS horarios FROM appointment");
  expect(rows).toEqual([{ horarios: 0 }]);

  // Do formulário, campo opcional vazio chega como "": é o mesmo que não informar.
  expect(
    await cadastrarHorario(horario({ estiloId: "", tamanhoId: "", emailCliente: "" }), ana),
  ).toMatchObject({ ok: true });
});

it("RF22 o e-mail opcional liga o horário à conta ativa; e-mail sem conta é recusado", async () => {
  const { cadastrarHorario } = await import("../../src/modules/scheduling");
  expect(await cadastrarHorario(horario({ emailCliente: "ninguem@pbi34.test" }), ana)).toEqual({
    ok: false,
    erro: "cliente_inexistente",
    mensagem: "Nenhuma conta ativa com esse e-mail.",
  });
  const ligado = await cadastrarHorario(horario({ emailCliente: " CLIENTE@pbi17.test " }), ana);
  if (!ligado.ok) throw new Error(ligado.mensagem);
  const { rows } = await db.query(
    'SELECT u.email FROM appointment a JOIN "user" u ON u.id = a.user_id WHERE a.id = $1',
    [ligado.dados.id],
  );
  expect(rows).toEqual([{ email: "cliente@pbi17.test" }]);
});

it("RF22/RN08 editar respeita a sobreposição, cancelar libera o intervalo e horário finalizado não muda", async () => {
  const { cadastrarHorario, editarHorario, mudarSituacaoHorario } =
    await import("../../src/modules/scheduling");
  const a = await cadastrarHorario(horario(), ana);
  const b = await cadastrarHorario(
    horario({ nomeContato: "Bruna", inicio: "2026-10-15T18:00", fim: "2026-10-15T19:00" }),
    ana,
  );
  if (!a.ok || !b.ok) throw new Error("Falha ao preparar a agenda");
  const idA = a.dados.id;
  const idB = b.dados.id;
  const editarB = (extra: Record<string, unknown>) =>
    editarHorario({ id: idB, ...horario({ nomeContato: "Bruna", ...extra }) }, ana);

  expect(await editarB({ inicio: "2026-10-15T16:00", fim: "2026-10-15T18:00" })).toMatchObject({
    ok: false,
    erro: "sobreposto",
  });
  expect(
    await editarB({ inicio: "2026-10-15T17:00", fim: "2026-10-15T19:00", observacoes: "Retoque" }),
  ).toEqual({ ok: true, dados: undefined });
  const editado = await db.query(
    "SELECT inicia_em, termina_em, descricao, codigo FROM appointment WHERE id = $1",
    [idB],
  );
  expect(editado.rows[0]).toMatchObject({
    inicia_em: new Date("2026-10-15T20:00:00Z"),
    termina_em: new Date("2026-10-15T22:00:00Z"),
    descricao: "Retoque",
    codigo: b.dados.codigo,
  });

  expect(await mudarSituacaoHorario({ id: idA, situacao: "CANCELADO" }, ana)).toEqual({
    ok: true,
    dados: undefined,
  });
  // O intervalo de A ficou livre.
  expect(await editarB({ inicio: "2026-10-15T14:00", fim: "2026-10-15T16:00" })).toMatchObject({
    ok: true,
  });

  const finalizado = {
    ok: false,
    erro: "finalizado",
    mensagem: "Este horário já foi cancelado ou concluído.",
  };
  expect(await editarHorario({ id: idA, ...horario() }, ana)).toEqual(finalizado);
  expect(await mudarSituacaoHorario({ id: idA, situacao: "CONCLUIDO" }, ana)).toEqual(finalizado);
  expect(await mudarSituacaoHorario({ id: idB, situacao: "CONCLUIDO" }, ana)).toMatchObject({
    ok: true,
  });
  expect(await editarB({})).toEqual(finalizado);
  expect(await mudarSituacaoHorario({ id: idB, situacao: "AGENDADO" }, ana)).toMatchObject({
    ok: false,
    erro: "invalido",
  });
  const { rows } = await db.query("SELECT situacao FROM appointment ORDER BY nome_contato");
  expect(rows.map((r) => r.situacao)).toEqual(["CONCLUIDO", "CANCELADO"]);
});

it("RN10 outro artista não altera nem descobre o horário; o admin altera qualquer um", async () => {
  const { cadastrarHorario, editarHorario, mudarSituacaoHorario } =
    await import("../../src/modules/scheduling");
  const criado = await cadastrarHorario(horario(), ana);
  if (!criado.ok) throw new Error(criado.mensagem);
  const { id } = criado.dados;
  const naoEncontrado = { ok: false, erro: "nao_encontrado" };

  expect(await editarHorario({ id, ...horario() }, bia)).toMatchObject(naoEncontrado);
  expect(await mudarSituacaoHorario({ id, situacao: "CANCELADO" }, bia)).toMatchObject(
    naoEncontrado,
  );
  for (const inexistente of ["9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d", "x", ""])
    expect(
      await mudarSituacaoHorario({ id: inexistente, situacao: "CANCELADO" }, ana),
      inexistente,
    ).toMatchObject(naoEncontrado);
  expect(await editarHorario({ id, ...horario({ artistaId: idBia }) }, ana)).toMatchObject({
    ok: false,
    erro: "proibido",
  });
  expect(await mudarSituacaoHorario({ id, situacao: "CANCELADO" }, new Headers())).toMatchObject({
    ok: false,
    erro: "nao_autenticado",
  });

  // O admin pode passar o horário para outra artista e cancelar.
  expect(await editarHorario({ id, ...horario({ artistaId: idBia }) }, admin)).toMatchObject({
    ok: true,
  });
  expect(await mudarSituacaoHorario({ id, situacao: "CANCELADO" }, admin)).toMatchObject({
    ok: true,
  });
  const { rows } = await db.query("SELECT artist_id, situacao FROM appointment WHERE id = $1", [
    id,
  ]);
  expect(rows).toEqual([{ artist_id: idBia, situacao: "CANCELADO" }]);
});
