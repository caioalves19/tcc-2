import { MercadoPagoConfig, Payment, PaymentRefund, Preference } from "mercadopago";
import type { GatewayPagamento } from "./pagamento";

const TEMPO_LIMITE_MS = 10_000;
const DOMINIOS_MERCADO_PAGO = ["mercadopago.com.br", "mercadopago.com"];

// O cliente é redirecionado para esta URL: só https e só domínio do Mercado Pago, mesmo que a
// resposta venha da API autenticada.
function checkoutDoMercadoPago(url: string | undefined): url is string {
  if (!url) return false;
  try {
    const { protocol, hostname } = new URL(url);
    return (
      protocol === "https:" &&
      DOMINIOS_MERCADO_PAGO.some((d) => hostname === d || hostname.endsWith(`.${d}`))
    );
  } catch {
    return false;
  }
}

// RF13/RNF12: o token só vem do ambiente; sem ele o app sobe, mas abrir pagamento falha.
// Credenciais do vendedor de teste (sandbox) ou de produção mudam só a variável.
export function gatewayMercadoPago(
  accessToken: string | undefined = process.env.MP_ACCESS_TOKEN,
): GatewayPagamento {
  const configurar = () => {
    if (!accessToken) throw new Error("MP_ACCESS_TOKEN não configurado");
    return new MercadoPagoConfig({ accessToken, options: { timeout: TEMPO_LIMITE_MS } });
  };
  return {
    async criarPreferencia(corpo) {
      const config = configurar();
      const criada = await new Preference(config).create({
        body: corpo,
        requestOptions: { timeout: TEMPO_LIMITE_MS },
      });
      if (!checkoutDoMercadoPago(criada.init_point))
        throw new Error("Preferência criada sem init_point do Mercado Pago");
      return { url: criada.init_point };
    },
    // RF14: a situação real do pagamento, que o webhook lê com lerPagamento. Pagamento que a
    // API não encontra (404) volta null: reenviar o aviso não o faria aparecer.
    async consultarPagamento(id) {
      const config = configurar();
      try {
        return await new Payment(config).get({ id, requestOptions: { timeout: TEMPO_LIMITE_MS } });
      } catch (erro) {
        if (erro instanceof Error && "status" in erro && erro.status === 404) return null;
        throw erro;
      }
    },
    // PBI-43: estorno total; a mesma chave numa nova tentativa devolve o mesmo estorno.
    async estornarPagamento(id, chaveIdempotencia) {
      const config = configurar();
      await new PaymentRefund(config).total({
        payment_id: id,
        requestOptions: { timeout: TEMPO_LIMITE_MS, idempotencyKey: chaveIdempotencia },
      });
    },
    // PBI-43: Pix ou boleto ainda não pago deixa de aceitar pagamento.
    async cancelarPagamento(id) {
      const config = configurar();
      await new Payment(config).cancel({ id, requestOptions: { timeout: TEMPO_LIMITE_MS } });
    },
  };
}
