import { z } from "zod";
import { deSaoPauloParaUtc, paraHorarioSaoPaulo, somarDias } from "../../lib/fuso";

// RF32 (PBI-48): período do relatório de vendas, em dias inteiros de São Paulo (RN09). A consulta
// usa [inicio, fim): o fim é a meia-noite do dia seguinte ao último.

export const PERIODOS = ["este-mes", "30-dias", "intervalo"] as const;
export type TipoPeriodo = (typeof PERIODOS)[number];

export type PeriodoRelatorio = {
  tipo: TipoPeriodo;
  // Primeiro e último dia, "AAAA-MM-DD", os dois incluídos.
  de: string;
  ate: string;
  inicio: Date;
  fim: Date;
  // Intervalo pedido que não vale: o relatório mostra o mês corrente e diz por quê.
  aviso: string | null;
};

// Vem da URL (?periodo=...&de=...&ate=...): período desconhecido volta ao mês corrente.
const schemaPeriodo = z.object({
  periodo: z.enum(PERIODOS).catch("este-mes"),
  de: z.string().catch(""),
  ate: z.string().catch(""),
});

// Meia-noite de São Paulo do dia; fora do formato, impossível ou fora de 2020–2100: null.
const meiaNoite = (data: string): Date | null => deSaoPauloParaUtc(`${data}T00:00`);

// Este mês (do dia 1 até hoje) ou os últimos 30 dias (hoje e os 29 anteriores).
function ateHoje(tipo: "este-mes" | "30-dias", agora: Date): PeriodoRelatorio {
  const hoje = paraHorarioSaoPaulo(agora).slice(0, 10);
  const de = tipo === "30-dias" ? somarDias(hoje, -29) : `${hoje.slice(0, 8)}01`;
  return {
    tipo,
    de,
    ate: hoje,
    inicio: meiaNoite(de) ?? new Date(0),
    fim: meiaNoite(somarDias(hoje, 1)) ?? new Date(0),
    aviso: null,
  };
}

export function periodoDoRelatorio(entrada: unknown, agora: Date = new Date()): PeriodoRelatorio {
  const { periodo, de, ate } = schemaPeriodo.parse(
    typeof entrada === "object" && entrada !== null ? entrada : {},
  );
  if (periodo !== "intervalo") return ateHoje(periodo, agora);

  const inicio = meiaNoite(de);
  const ultimoDia = meiaNoite(ate);
  const fim = ultimoDia && meiaNoite(somarDias(ate, 1));
  if (!inicio || !ultimoDia || !fim)
    return {
      ...ateHoje("este-mes", agora),
      aviso: "Escolha as duas datas do intervalo. Mostrando este mês.",
    };
  if (inicio > ultimoDia)
    return {
      ...ateHoje("este-mes", agora),
      aviso: "A data inicial deve ser igual ou anterior à final. Mostrando este mês.",
    };
  return { tipo: "intervalo", de, ate, inicio, fim, aviso: null };
}
