import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { prepararContas } from "./contas-pbi17";

let db: Client;
let ana: Headers;
let bia: Headers;
let idAna: string;
let estiloId: string;
let tamanhoId: string;

beforeAll(async () => {
  ({ db, ana, bia, idAna } = await prepararContas("kolo_pbi34_agenda_test"));
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
