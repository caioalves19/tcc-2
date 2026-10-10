import { obterPrisma } from "../../lib/prisma";
import { lerPedido, type ContextoCarrinho } from "../orders/index";
import { prazoParaPagar } from "./cliente";
import { montarPreferencia, type CorpoPreferencia } from "./preferencia";

// Porta do provedor: o módulo só pede a preferência e recebe a URL do checkout hospedado.
export type GatewayPagamento = {
  criarPreferencia(corpo: CorpoPreferencia): Promise<{ url: string }>;
};

export type OpcoesPagamento = { gateway: GatewayPagamento; agora?: Date; appUrl?: string };

export type ResultadoPagamento =
  | { ok: true; dados: { url: string } }
  | {
      ok: false;
      erro:
        "nao_encontrado" | "nao_pendente" | "pagamento_em_aberto" | "reserva_expirada" | "falha";
      mensagem: string;
    };

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
  if (pedido.situacao !== "PENDENTE")
    return { ok: false, erro: "nao_pendente", mensagem: "Este pedido não aguarda pagamento." };
  // RN06: Pix ou boleto emitido segura as unidades até vencer; outra cobrança do mesmo pedido
  // abriria a porta para pagar duas vezes.
  const emAberto = await obterPrisma().payment.count({
    where: { status: "PENDENTE", order: { number: pedido.numero } },
  });
  if (emAberto > 0)
    return {
      ok: false,
      erro: "pagamento_em_aberto",
      mensagem: "Este pedido já tem um pagamento aguardando confirmação.",
    };
  // RN03: sem unidades presas, pagar agora poderia vender o que já voltou à vitrine.
  if (!pedido.reservaExpiraEm)
    return {
      ok: false,
      erro: "reserva_expirada",
      mensagem: "A reserva das obras expirou. Finalize de novo pelo carrinho.",
    };
  // RN06: nos minutos finais da reserva o checkout já fechou (FOLGA_PAGAMENTO_MS), para um Pix ou
  // boleto gerado no último instante ainda encontrar a reserva quando o webhook chegar.
  const prazo = prazoParaPagar(pedido.reservaExpiraEm);
  if (!prazo || prazo <= agora)
    return {
      ok: false,
      erro: "reserva_expirada",
      mensagem: "O prazo para pagar este pedido acabou. Finalize de novo pelo carrinho.",
    };
  const preferencia = montarPreferencia(pedido, opcoes.appUrl ?? process.env.APP_URL ?? "");
  if (!preferencia.ok) return { ok: false, erro: "falha", mensagem: preferencia.mensagem };
  try {
    return { ok: true, dados: await opcoes.gateway.criarPreferencia(preferencia.dados) };
  } catch (erro) {
    // Só o tipo do erro: a resposta do provedor pode trazer dados do pedido ou da conta.
    console.error(
      "Falha ao criar a preferência no Mercado Pago",
      erro instanceof Error ? erro.name : "erro desconhecido",
    );
    return {
      ok: false,
      erro: "falha",
      mensagem: "Não foi possível abrir o pagamento agora. Tente de novo em instantes.",
    };
  }
}
