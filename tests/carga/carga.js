// APS (qualidade): carga de ~20 usuários simultâneos em catálogo, ficha da obra e checkout.
// Metas (docs/aps/PLANO.md): leitura p95 < 500 ms; checkout p95 < 1 s; erro < 1%.
//
//   docker run --rm -v "$PWD:/repo" -w /repo/tests/carga grafana/k6:1.3.0 run carga.js
/* global __VU -- globais do runtime do k6 */
import { check, sleep } from "k6";
import http from "k6/http";

import { BASE, OBRA_CARGA, finalizar, pedidoCriado, prepararCliente } from "./comum.js";

export const options = {
  scenarios: {
    leitura: {
      executor: "ramping-vus",
      exec: "leitura",
      stages: [
        { duration: "30s", target: 20 },
        { duration: "3m", target: 20 },
        { duration: "15s", target: 0 },
      ],
    },
    checkout: {
      executor: "ramping-vus",
      exec: "checkout",
      stages: [
        { duration: "30s", target: 5 },
        { duration: "3m", target: 5 },
        { duration: "15s", target: 0 },
      ],
    },
  },
  thresholds: {
    "http_req_duration{pagina:catalogo}": ["p(95)<500"],
    "http_req_duration{pagina:obra}": ["p(95)<500"],
    "http_req_duration{etapa:finalizar}": ["p(95)<1000"],
    "http_req_failed{scenario:leitura}": ["rate<0.01"],
    "checks{etapa:finalizar}": ["rate>0.99"],
  },
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export function leitura() {
  const catalogo = http.get(`${BASE}/obras`, { tags: { pagina: "catalogo" } });
  check(catalogo, { "catálogo 200": (r) => r.status === 200 });
  const obra = http.get(`${BASE}/obras/${OBRA_CARGA.slug}`, { tags: { pagina: "obra" } });
  check(obra, { "ficha 200": (r) => r.status === 200 });
  sleep(1);
}

// Cada iteração é um cliente novo: cadastro → carrinho → finalizar (retirada no ateliê).
export function checkout() {
  const { cadastro, carrinho, cookie } = prepararCliente(`vu${__VU}`, OBRA_CARGA.id);
  check(cadastro, { "cadastro aceito": (r) => r.status === 200 });
  check(carrinho, { "carrinho 200": (r) => r.status === 200 });
  const resposta = finalizar(cookie, { etapa: "finalizar" });
  check(resposta, { "pedido criado": pedidoCriado }, { etapa: "finalizar" });
  sleep(1);
}
