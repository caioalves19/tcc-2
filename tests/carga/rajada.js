// APS (qualidade): rajada concorrente — N clientes finalizam a compra da MESMA obra de estoque 1
// ao mesmo tempo. Meta: exatamente 1 pedido criado e N−1 recusados (RN de estoque único).
// Rode com o banco recém-preparado (tests/carga/servidor.ts), uma vez por subida.
//
// DISPARO é o instante (ms desde a época) em que todos finalizam; dê folga para os cadastros.
//   docker run --rm -v "$PWD:/repo" -w /repo/tests/carga grafana/k6:1.3.0 run -e N=30 \
//     -e DISPARO=$(( $(date +%s) * 1000 + 60000 )) rajada.js
/* global __ENV, __VU -- globais do runtime do k6 */
import { check } from "k6";
import { Counter } from "k6/metrics";

import { OBRA_RAJADA, finalizar, pedidoCriado, prepararCliente } from "./comum.js";

const N = Number(__ENV.N || 30);
const DISPARO = Number(__ENV.DISPARO);
if (!DISPARO) throw new Error("Defina -e DISPARO=<ms desde a época> (ver o cabeçalho).");
const criados = new Counter("pedidos_criados");
const recusados = new Counter("pedidos_recusados");

export const options = {
  scenarios: {
    rajada: { executor: "per-vu-iterations", vus: N, iterations: 1, maxDuration: "2m" },
  },
  thresholds: {
    pedidos_criados: ["count==1"],
    pedidos_recusados: [`count==${N - 1}`],
  },
  summaryTrendStats: ["avg", "min", "med", "p(95)", "max"],
};

export default function () {
  const { cookie } = prepararCliente(`rajada${__VU}`, OBRA_RAJADA.id);
  // Barreira: todos os VUs disparam o checkout no mesmo instante (relógio de parede).
  while (Date.now() < DISPARO) {
    /* espera ativa até o instante combinado */
  }
  const resposta = finalizar(cookie, { etapa: "rajada" });
  if (pedidoCriado(resposta)) criados.add(1);
  else recusados.add(1);
  check(resposta, { "resposta 2xx/3xx": (r) => r.status >= 200 && r.status < 400 });
}
