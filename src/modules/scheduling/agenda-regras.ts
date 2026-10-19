import { codigoLegivel } from "../../lib/codigo";
import { paraData, paraHorarioSaoPaulo, somarDias } from "../../lib/fuso";

// Regras puras da agenda (PBI-34), sem banco: semana e código do horário. O fuso de São Paulo
// (RN09) fica em src/lib/fuso.ts, compartilhado com o relatório de vendas (PBI-48).

// Segunda-feira ("AAAA-MM-DD") da semana da data pedida; sem data válida, da semana de agora em
// São Paulo.
export function inicioDaSemana(referencia: string | undefined, agora: Date = new Date()): string {
  const data =
    (referencia ? paraData(referencia) : null) ??
    paraData(paraHorarioSaoPaulo(agora).slice(0, 10)) ??
    new Date(0);
  const recuo = (data.getUTCDay() + 6) % 7;
  return somarDias(data.toISOString().slice(0, 10), -recuo);
}

// RF22: código do horário, AG- + o mesmo formato do número do pedido.
export function codigoDoHorario(agora: Date, aleatorio: Uint8Array): string {
  return `AG-${codigoLegivel(agora, aleatorio)}`;
}
