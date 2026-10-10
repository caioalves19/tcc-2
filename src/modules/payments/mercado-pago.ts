import { MercadoPagoConfig, Preference } from "mercadopago";
import type { GatewayPagamento } from "./pagamento";

const TEMPO_LIMITE_MS = 10_000;

// RF13/RNF12: o token só vem do ambiente; sem ele o app sobe, mas abrir pagamento falha.
// Credenciais do vendedor de teste (sandbox) ou de produção mudam só a variável.
export function gatewayMercadoPago(
  accessToken: string | undefined = process.env.MP_ACCESS_TOKEN,
): GatewayPagamento {
  return {
    async criarPreferencia(corpo) {
      if (!accessToken) throw new Error("MP_ACCESS_TOKEN não configurado");
      const config = new MercadoPagoConfig({ accessToken, options: { timeout: TEMPO_LIMITE_MS } });
      const criada = await new Preference(config).create({
        body: corpo,
        requestOptions: { timeout: TEMPO_LIMITE_MS },
      });
      if (!criada.init_point) throw new Error("Preferência criada sem init_point");
      return { url: criada.init_point };
    },
  };
}
