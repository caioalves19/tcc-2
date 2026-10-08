import type { Client } from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";
import { prepararBancoDeTeste } from "./banco-de-teste";

let db: Client;
let pararTarefas: (() => Promise<void>) | undefined;

beforeAll(async () => {
  db = await prepararBancoDeTeste("kolo_pbi25_tarefas_test");
}, 120_000);
afterAll(async () => {
  await pararTarefas?.();
  await db?.end();
});

async function esperar(condicao: () => Promise<boolean>, limiteMs: number) {
  const fim = Date.now() + limiteMs;
  while (Date.now() < fim) {
    if (await condicao()) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

it("RN03 o pg-boss agenda a limpeza a cada minuto e o worker apaga as reservas vencidas", async () => {
  const { iniciarTarefas, FILA_LIBERAR_RESERVAS } = await import("../../src/lib/tarefas");
  await db.query(
    `INSERT INTO "user" (id, nome, email, telefone, papel, situacao, criado_em, atualizado_em)
     VALUES (gen_random_uuid(), 'Pessoa', 'pessoa@pbi25.test', '11987654321', 'CLIENTE', 'ATIVO', now(), now())`,
  );
  await db.query(
    `INSERT INTO artist (id, user_id, slug) SELECT gen_random_uuid(), id, 'ana' FROM "user"`,
  );
  await db.query(
    `INSERT INTO artwork (id, artist_id, titulo, slug, preco_centavos)
     SELECT gen_random_uuid(), id, 'Obra', 'obra', 10000 FROM artist`,
  );
  await db.query(
    `INSERT INTO session (id, user_id, token, expira_em, atualizado_em)
     SELECT gen_random_uuid(), id, 'token-pbi25', now() + interval '1 day', now() FROM "user"`,
  );
  await db.query(
    `INSERT INTO artwork_reservation (id, artwork_id, session_id, quantidade, expira_em)
     SELECT gen_random_uuid(), a.id, s.id, 1, e.expira
     FROM artwork a, session s,
       (VALUES (now() - interval '1 minute'), (now() + interval '10 minutes')) AS e(expira)`,
  );

  const tarefas = await iniciarTarefas();
  pararTarefas = () => tarefas.stop({ graceful: false });

  const agendas = await tarefas.getSchedules();
  expect(agendas).toMatchObject([{ name: FILA_LIBERAR_RESERVAS, cron: "* * * * *" }]);

  // Não espera o próximo minuto: dispara a mesma fila que o agendamento dispara.
  await tarefas.send(FILA_LIBERAR_RESERVAS);
  const limpou = await esperar(async () => {
    const { rows } = await db.query("SELECT count(*)::int AS n FROM artwork_reservation");
    return rows[0].n === 1;
  }, 15_000);
  expect(limpou).toBe(true);
  const { rows } = await db.query("SELECT expira_em > now() AS ativa FROM artwork_reservation");
  expect(rows).toEqual([{ ativa: true }]);
}, 30_000);
