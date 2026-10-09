import type { Modalidade } from "./checkout";

// Regras puras do carrinho (PBI-24), sem banco: quantidade, disponibilidade e totais.

type Situacao = "RASCUNHO" | "DISPONIVEL" | "ESGOTADA";

// RN02: a quantidade vai de 1 até o estoque atual. O carrinho não reserva (isso é o PBI-25).
export function quantidadeValida(quantidade: number, estoque: number): boolean {
  return Number.isInteger(quantidade) && quantidade >= 1 && quantidade <= estoque;
}

// Ao entrar na conta, a mesma obra nos dois carrinhos fica com a maior quantidade.
export function quantidadeAoJuntar(visitante: number, conta: number, estoque: number): number {
  return Math.min(Math.max(visitante, conta), estoque);
}

// RN11: compra só obra publicada como disponível, com estoque e não arquivada.
export function obraDisponivel(obra: {
  situacao: Situacao;
  arquivada: boolean;
  estoque: number;
}): boolean {
  return obra.situacao === "DISPONIVEL" && !obra.arquivada && obra.estoque > 0;
}

export function resumirCarrinho(
  itens: { precoCentavos: number; quantidade: number; disponivel: boolean }[],
) {
  let totalCentavos = 0;
  let unidades = 0;
  let indisponiveis = 0;
  for (const item of itens) {
    if (!item.disponivel) {
      indisponiveis += 1;
      continue;
    }
    totalCentavos += item.precoCentavos * item.quantidade;
    unidades += item.quantidade;
  }
  return { totalCentavos, unidades, indisponiveis };
}

// PBI-26: sem 0, O, 1, I e L, que se confundem quando o cliente dita o número.
const ALFABETO_PEDIDO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

// Número do pedido: AAAAMMDD (data de São Paulo, RN09) + 6 caracteres sorteados.
// Não é sequencial, para não expor o volume de vendas; a unicidade fica com o banco.
export function numeroDoPedido(agora: Date, aleatorio: Uint8Array): string {
  const data = agora.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const sufixo = Array.from(
    aleatorio.slice(0, 6),
    (byte) => ALFABETO_PEDIDO[byte % ALFABETO_PEDIDO.length],
  ).join("");
  return `${data.replaceAll("-", "")}-${sufixo}`;
}

type SituacaoNoBanco = "PENDENTE" | "PAGO" | "PROCESSANDO" | "ENVIADO" | "ENTREGUE" | "CANCELADO";
type SituacaoPagamento = "PENDENTE" | "APROVADO" | "RECUSADO" | "ESTORNADO";

export type SituacaoCliente =
  "AGUARDANDO_PAGAMENTO" | "PAGO" | "EM_PREPARACAO" | "ENVIADO" | "ENTREGUE" | "CANCELADO";

const DEPOIS_DO_PAGAMENTO = {
  PAGO: "PAGO",
  PROCESSANDO: "EM_PREPARACAO",
  ENVIADO: "ENVIADO",
  ENTREGUE: "ENTREGUE",
} as const satisfies Partial<Record<SituacaoNoBanco, SituacaoCliente>>;

// RF16 (PBI-29): o que o cliente vê do pedido. Tentativa de compra que nunca teve pagamento fica
// oculta (null): o checkout abandonado e o cancelado por um novo "Finalizar" (PBI-26). O PBI-30
// pode reaproveitar a mesma leitura.
export function situacaoParaCliente(pedido: {
  situacao: SituacaoNoBanco;
  pagamentos: readonly SituacaoPagamento[];
  reservaAtiva: boolean;
}): SituacaoCliente | null {
  if (pedido.situacao === "PENDENTE")
    return pedido.reservaAtiva || pedido.pagamentos.includes("PENDENTE")
      ? "AGUARDANDO_PAGAMENTO"
      : null;
  if (pedido.situacao === "CANCELADO") return pedido.pagamentos.length > 0 ? "CANCELADO" : null;
  return DEPOIS_DO_PAGAMENTO[pedido.situacao];
}

// RF29 (PBI-30): andamento operacional que o admin controla. Pendente → Pago é só do gateway
// (RN05, PBI-28), e cancelar fica fora da tela do admin (reembolso e estoque dependem do 27/28).
const ANDAMENTO = ["PAGO", "PROCESSANDO", "ENVIADO", "ENTREGUE"] as const;

// Só para frente, podendo pular etapas (uma retirada no mesmo dia vai de Pago a Entregue).
export function transicaoPermitida(de: SituacaoNoBanco, para: SituacaoNoBanco): boolean {
  const ordem: readonly SituacaoNoBanco[] = ANDAMENTO;
  const origem = ordem.indexOf(de);
  const destino = ordem.indexOf(para);
  return origem >= 0 && destino > origem;
}

export function proximasSituacoes(de: SituacaoNoBanco): SituacaoNoBanco[] {
  return ANDAMENTO.filter((para) => transicaoPermitida(de, para));
}

// Rótulo da situação, o mesmo na conta do cliente (PBI-29) e no admin (PBI-30). "Não concluído"
// só aparece para o admin: é a tentativa sem pagamento, oculta para o cliente.
const ROTULOS: Record<SituacaoCliente | "NAO_CONCLUIDO", string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGO: "Pago",
  EM_PREPARACAO: "Em preparação",
  ENVIADO: "Enviado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
  NAO_CONCLUIDO: "Não concluído",
};

// Na retirada no ateliê não há envio: o pedido fica pronto e o cliente retira. No banco continua
// ENVIADO e ENTREGUE. Cada modalidade nova do PBI-42 entra aqui com os rótulos dela.
const ROTULOS_POR_MODALIDADE: Record<Modalidade, Partial<Record<SituacaoCliente, string>>> = {
  RETIRADA: { ENVIADO: "Pronto para retirada", ENTREGUE: "Retirado" },
};

export function rotuloSituacao(
  situacao: SituacaoCliente | "NAO_CONCLUIDO",
  modalidade: Modalidade,
): string {
  if (situacao === "NAO_CONCLUIDO") return ROTULOS.NAO_CONCLUIDO;
  return ROTULOS_POR_MODALIDADE[modalidade][situacao] ?? ROTULOS[situacao];
}
