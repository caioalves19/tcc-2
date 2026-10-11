import type { Client } from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";
import { prepararContas } from "./contas-pbi17";
import { fabricaDePedidos } from "./pedidos-de-teste";

let db: Client;
let fabrica: ReturnType<typeof fabricaDePedidos>;

beforeAll(async () => {
  const contas = await prepararContas("kolo_pbi28_webhook_test");
  db = contas.db;
  fabrica = fabricaDePedidos(db, contas.admin, contas.idAna);
}, 120_000);
afterAll(async () => {
  await db?.end();
});

const AGORA = new Date("2026-10-11T15:00:00.000Z");
const RESERVA_ATE = "2026-10-11T15:10:00.000Z";

async function pedidoPendente(slug: string, numero: string, email: string) {
  const obra = await fabrica.obraPublicada(slug, "4.800,00", 2);
  const cliente = await fabrica.novoCliente(email);
  const pedidoId = await fabrica.pedidoDeTeste(cliente, {
    numero,
    situacao: "PENDENTE",
    criadoEm: AGORA.toISOString(),
    obra,
    reservaAte: RESERVA_ATE,
  });
  return { obra, cliente, pedidoId };
}

it("RNF11 o mesmo pagamento do Mercado Pago não vira duas linhas em payment", async () => {
  const { pedidoId } = await pedidoPendente("t3-unico", "20261011-UNICO1", "unico@pbi28.test");
  const inserir = () =>
    db.query(
      `INSERT INTO payment (id, order_id, provedor, id_externo, metodo, situacao, valor_centavos)
       VALUES (gen_random_uuid(), $1, 'mercado_pago', '999001', 'CARTAO', 'PENDENTE', 960000)`,
      [pedidoId],
    );
  await inserir();
  await expect(inserir()).rejects.toThrow(/duplicate key|unique/i);
});

it("RF13 o saldo da conta Mercado Pago é um meio de pagamento próprio", async () => {
  const { pedidoId } = await pedidoPendente("t3-saldo", "20261011-SALDO1", "saldo@pbi28.test");
  await db.query(
    `INSERT INTO payment (id, order_id, provedor, id_externo, metodo, situacao, valor_centavos)
     VALUES (gen_random_uuid(), $1, 'mercado_pago', '999002', 'SALDO_MERCADO_PAGO', 'APROVADO', 960000)`,
    [pedidoId],
  );
  const { rows } = await db.query("SELECT metodo FROM payment WHERE id_externo = '999002'");
  expect(rows).toEqual([{ metodo: "SALDO_MERCADO_PAGO" }]);
});
