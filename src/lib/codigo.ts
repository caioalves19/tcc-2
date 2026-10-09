// Código legível para pedidos (PBI-26) e horários da agenda (PBI-34): AAAAMMDD (data de São Paulo,
// RN09) + 6 caracteres sorteados, sem 0, O, 1, I e L, que se confundem quando alguém dita o código.
// Não é sequencial, para não expor volume; a unicidade fica com o banco.
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function codigoLegivel(agora: Date, aleatorio: Uint8Array): string {
  const data = agora.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const sufixo = Array.from(aleatorio.slice(0, 6), (byte) => ALFABETO[byte % ALFABETO.length]).join(
    "",
  );
  return `${data.replaceAll("-", "")}-${sufixo}`;
}
