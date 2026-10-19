// PBI-45 (E2E): dublê da API do Mercado Pago no processo do servidor. O playwright.config.ts o
// carrega no `next start` por NODE_OPTIONS=--import; o código do app não muda. Só as chamadas a
// api.mercadopago.com são desviadas (o SDK usa o fetch global); o resto segue para o fetch real.
//
// - POST /checkout/preferences: guarda a referência (número do pedido) e o total dos itens e
//   devolve um init_point no domínio do Mercado Pago, como o Checkout Pro.
// - GET /v1/payments/{id}: pagamento aprovado da última preferência, no formato que
//   src/modules/payments/leitura.ts lê. O webhook do teste é que manda consultar.
//
// Carregado pelo strip de tipos do Node, fora do bundler: sem imports de "@/..." nem caminhos
// sem extensão.

const API = "https://api.mercadopago.com";

type ItemPreferencia = { unit_price: number; quantity: number };
type Preferencia = { referencia: string; totalReais: number };

let ultima: Preferencia | null = null;
const fetchReal = globalThis.fetch;

function json(corpo: unknown, status: number): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "content-type": "application/json" },
  });
}

globalThis.fetch = async (entrada: string | URL | Request, init?: RequestInit) => {
  const url =
    typeof entrada === "string" ? entrada : entrada instanceof URL ? entrada.href : entrada.url;
  if (!url.startsWith(`${API}/`)) return fetchReal(entrada, init);

  // O SDK chama "/checkout/preferences/", com barra no fim.
  const pathname = new URL(url).pathname.replace(/\/+$/, "");
  // O SDK chama fetch(url, init); um Request também é aceito, por via das dúvidas.
  const requisicao = entrada instanceof Request ? entrada : null;
  const metodo = (init?.method ?? requisicao?.method ?? "GET").toUpperCase();

  if (metodo === "POST" && pathname === "/checkout/preferences") {
    const texto = init?.body !== undefined ? String(init.body) : await requisicao?.text();
    const corpo = JSON.parse(texto ?? "{}") as {
      external_reference: string;
      items: ItemPreferencia[];
    };
    const totalReais = corpo.items.reduce((soma, i) => soma + i.unit_price * i.quantity, 0);
    ultima = { referencia: corpo.external_reference, totalReais };
    return json(
      {
        id: "pref-e2e",
        init_point: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-e2e",
      },
      201,
    );
  }

  const pagamento = pathname.match(/^\/v1\/payments\/(\d+)$/);
  if (metodo === "GET" && pagamento && ultima) {
    const agora = new Date().toISOString();
    return json(
      {
        id: Number(pagamento[1]),
        status: "approved",
        status_detail: "accredited",
        payment_type_id: "credit_card",
        payment_method_id: "visa",
        transaction_amount: ultima.totalReais,
        currency_id: "BRL",
        external_reference: ultima.referencia,
        date_created: agora,
        date_approved: agora,
      },
      200,
    );
  }

  return json({ message: "Chamada não simulada no E2E", status: 404 }, 404);
};
