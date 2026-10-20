// Datas "AAAA-MM-DD" que já chegam no fuso de São Paulo (RN09): só formatam, sem conversão, como
// na agenda. Painel e relatório de vendas (PBI-48).

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

// "2026-10-01" → "01/10/2026".
export const dataBr = (data: string) =>
  `${data.slice(8, 10)}/${data.slice(5, 7)}/${data.slice(0, 4)}`;

// "2026-10-01" → "outubro de 2026".
export const nomeDoMes = (data: string) =>
  `${MESES[Number(data.slice(5, 7)) - 1]} de ${data.slice(0, 4)}`;

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// Horário "AAAA-MM-DDTHH:MM" de São Paulo → "Segunda, 19/10" e "12:00".
export const diaDaSemana = (horario: string) =>
  `${DIAS[new Date(`${horario.slice(0, 10)}T00:00:00Z`).getUTCDay()]}, ${horario.slice(8, 10)}/${horario.slice(5, 7)}`;
export const hora = (horario: string) => horario.slice(11, 16);
