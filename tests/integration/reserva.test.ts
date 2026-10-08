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
