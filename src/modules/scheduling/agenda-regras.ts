import { codigoLegivel } from "../../lib/codigo";

// Regras puras da agenda (PBI-34), sem banco: fuso, semana e código do horário.

// RN09: o Brasil não tem horário de verão desde 2019; São Paulo fica em UTC−03:00, como no wizard
// (PBI-31). O banco guarda UTC.
const DESLOCAMENTO_MS = 3 * 60 * 60 * 1000;
const DIA_MS = 24 * 60 * 60 * 1000;

function dataValida(ano: number, mes: number, dia: number): boolean {
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia
  );
}

// "2026-10-15T14:00" (o valor de um <input type="datetime-local">) em São Paulo → instante UTC.
// Fora do formato, data impossível ou fora de 2020–2100: null.
export function deSaoPauloParaUtc(texto: string): Date | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(texto);
  if (!partes) return null;
  const [ano, mes, dia, hora, minuto] = partes.slice(1).map(Number) as [
    number,
    number,
    number,
    number,
    number,
  ];
  if (ano < 2020 || ano > 2100 || hora > 23 || minuto > 59 || !dataValida(ano, mes, dia))
    return null;
  return new Date(Date.UTC(ano, mes - 1, dia, hora, minuto) + DESLOCAMENTO_MS);
}

// Instante UTC → "AAAA-MM-DDTHH:MM" em São Paulo (valor pronto para o datetime-local).
export function paraHorarioSaoPaulo(instante: Date): string {
  return new Date(instante.getTime() - DESLOCAMENTO_MS).toISOString().slice(0, 16);
}

function paraData(texto: string): Date | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) return null;
  const [ano, mes, dia] = partes.slice(1).map(Number) as [number, number, number];
  return dataValida(ano, mes, dia) ? new Date(Date.UTC(ano, mes - 1, dia)) : null;
}

// Segunda-feira ("AAAA-MM-DD") da semana da data pedida; sem data válida, da semana de agora em
// São Paulo.
export function inicioDaSemana(referencia: string | undefined, agora: Date = new Date()): string {
  const data =
    (referencia ? paraData(referencia) : null) ??
    paraData(paraHorarioSaoPaulo(agora).slice(0, 10)) ??
    new Date(0);
  const recuo = (data.getUTCDay() + 6) % 7;
  return new Date(data.getTime() - recuo * DIA_MS).toISOString().slice(0, 10);
}

export function somarDias(data: string, dias: number): string {
  const base = paraData(data) ?? new Date(0);
  return new Date(base.getTime() + dias * DIA_MS).toISOString().slice(0, 10);
}

// RF22: código do horário, AG- + o mesmo formato do número do pedido.
export function codigoDoHorario(agora: Date, aleatorio: Uint8Array): string {
  return `AG-${codigoLegivel(agora, aleatorio)}`;
}
