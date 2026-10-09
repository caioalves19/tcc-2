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
