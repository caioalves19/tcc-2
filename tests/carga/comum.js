// APS (qualidade): utilitários dos scripts k6. Roda no k6 (não no Node); fora da CI.
/* global __ENV, open -- globais do runtime do k6 */
import http from "k6/http";

export const BASE = __ENV.BASE_URL || "http://host.docker.internal:3100";

// Espelho de tests/carga/dados.ts.
export const OBRA_CARGA = { id: "00000000-0000-4000-9000-0000000000c1", slug: "carga-em-ocre" };
export const OBRA_RAJADA = {
  id: "00000000-0000-4000-9000-0000000000c2",
  slug: "rajada-em-vermelho",
};

// As server actions do Next são chamadas por POST com o id do build no cabeçalho Next-Action.
// O id muda a cada build; vem do manifest gerado pelo `npm run build`.
const manifest = JSON.parse(open("../../.next/server/server-reference-manifest.json"));

function idDaAcao(arquivo, nome) {
  for (const [id, acao] of Object.entries(manifest.node)) {
    if (acao.filename === arquivo && acao.exportedName === nome) return id;
  }
  throw new Error(`Server action não encontrada: ${arquivo}#${nome}`);
}

export const ACOES = {
  cadastrar: { id: idDaAcao("src/app/cadastro/actions.ts", "cadastrar"), pagina: "/cadastro" },
  adicionar: {
    id: idDaAcao("src/app/carrinho/actions.ts", "adicionarAoCarrinhoAcao"),
    pagina: "/carrinho",
  },
  endereco: { id: idDaAcao("src/app/conta/actions.ts", "salvarEnderecoAcao"), pagina: "/conta" },
  finalizar: {
    id: idDaAcao("src/app/checkout/actions.ts", "finalizarCompraAcao"),
    pagina: "/checkout",
  },
};

export function chamarAcao(acao, argumentos, params = {}) {
  return http.post(`${BASE}${acao.pagina}`, JSON.stringify(argumentos), {
    redirects: 0,
    ...params,
    headers: {
      "Next-Action": acao.id,
      "Content-Type": "text/plain;charset=UTF-8",
      Accept: "text/x-component",
      Origin: BASE,
      ...(params.headers || {}),
    },
  });
}

const ENDERECO = {
  destinatario: "Cliente Carga",
  cep: "01310100",
  logradouro: "Avenida Paulista",
  numero: "1000",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "SP",
};

// Em produção o Better Auth grava o cookie como __Secure-…; Secure, o jar do k6 não o devolve
// por http. O script guarda os cookies e os manda à mão no cabeçalho Cookie.
function cabecalhoCookie(...respostas) {
  const valores = {};
  for (const resposta of respostas) {
    for (const [nome, lista] of Object.entries(resposta.cookies)) {
      if (lista.length > 0) valores[nome] = lista[0].value;
    }
  }
  return Object.entries(valores)
    .map(([nome, valor]) => `${nome}=${valor}`)
    .join("; ");
}

// Cadastro + obra no carrinho, como o cliente faria pela tela. Devolve o Cookie da sessão.
export function prepararCliente(rotulo, obraId) {
  const email = `carga-${rotulo}-${Date.now()}-${Math.floor(Math.random() * 1e9)}@kolo.test`;
  const cadastro = chamarAcao(
    ACOES.cadastrar,
    [{ nome: "Cliente Carga", email, telefone: "11987654321", senha: "SenhaCarga#2026" }],
    { tags: { etapa: "cadastro" } },
  );
  const cookie = cabecalhoCookie(cadastro);
  // RF05: o checkout pede um endereço na conta, mesmo para retirar no ateliê.
  chamarAcao(ACOES.endereco, [ENDERECO], {
    tags: { etapa: "endereco" },
    headers: { Cookie: cookie },
  });
  const carrinho = chamarAcao(ACOES.adicionar, [obraId, 1], {
    tags: { etapa: "carrinho" },
    headers: { Cookie: cookie },
  });
  return { cadastro, carrinho, cookie };
}

// O redirect da action vem no cabeçalho X-Action-Redirect; a recusa vem no corpo.
export function finalizar(cookie, tags) {
  return chamarAcao(ACOES.finalizar, [{ modalidade: "RETIRADA" }], {
    tags,
    headers: { Cookie: cookie },
  });
}

export function pedidoCriado(resposta) {
  const destino = resposta.headers["X-Action-Redirect"] || resposta.headers["x-action-redirect"];
  return typeof destino === "string" && /\/checkout\/\d{8}-[A-Z0-9]{6}/.test(destino);
}
