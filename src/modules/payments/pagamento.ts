import { lerPedido, type ContextoCarrinho } from "../orders/index";
import { montarPreferencia, type CorpoPreferencia } from "./preferencia";

// Porta do provedor: o módulo só pede a preferência e recebe a URL do checkout hospedado.
export type GatewayPagamento = {
  criarPreferencia(corpo: CorpoPreferencia): Promise<{ url: string }>;
};

export type OpcoesPagamento = { gateway: GatewayPagamento; agora?: Date; appUrl?: string };

export type ResultadoPagamento =
  | { ok: true; dados: { url: string } }
  | { ok: false; erro: "nao_encontrado" | "falha"; mensagem: string };

const NAO_ENCONTRADO = {
  ok: false,
  erro: "nao_encontrado",
  mensagem: "Pedido não encontrado.",
} as const;

// RF13: só abre o Checkout Pro. Confirmar o pedido e baixar o estoque é do webhook (PBI-28),
// nunca deste fluxo nem da volta do navegador (RN05).
export async function iniciarPagamento(
  numero: unknown,
  contexto: ContextoCarrinho,
  opcoes: OpcoesPagamento,
): Promise<ResultadoPagamento> {
  const agora = opcoes.agora ?? new Date();
  const pedido = await lerPedido(numero, contexto, agora);
  if (!pedido) return NAO_ENCONTRADO;
  const preferencia = montarPreferencia(pedido, opcoes.appUrl ?? process.env.APP_URL ?? "");
  if (!preferencia.ok) return { ok: false, erro: "falha", mensagem: preferencia.mensagem };
  return { ok: true, dados: await opcoes.gateway.criarPreferencia(preferencia.dados) };
}
