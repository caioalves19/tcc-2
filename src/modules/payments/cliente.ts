// Código puro do pagamento para componentes de navegador (o index.ts traz SDK e banco).

// RN03/RN06: o checkout fecha antes da reserva. Um Pix ou boleto gerado no último instante ainda
// dá tempo ao webhook (PBI-28) de prorrogar a reserva enquanto ela existe.
export const FOLGA_PAGAMENTO_MS = 2 * 60 * 1000;

// Até quando o cliente pode começar a pagar (null se a reserva não está ativa).
export function prazoParaPagar(reservaExpiraEm: Date | null): Date | null {
  return reservaExpiraEm ? new Date(reservaExpiraEm.getTime() - FOLGA_PAGAMENTO_MS) : null;
}
