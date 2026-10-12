// PBI-42 (complemento do RF12): o frete é calculado no servidor a partir da modalidade e do
// endereço de entrega (RF05). Valores em centavos (RN07).

export type ModalidadeFrete = "RETIRADA" | "ENTREGA";

// Valores de exemplo, a confirmar com a equipe. Mudar um valor exige commit; a tela para o ADMIN
// editar fica anotada no PBI-39.
const FRETE_CAPITAL_SP_CENTAVOS = 3000;
// Fora da capital paulista, o valor vem da UF. UF fora da tabela não tem entrega (só retirada).
const FRETE_POR_UF_CENTAVOS: ReadonlyMap<string, number> = new Map(
  Object.entries({
    SP: 4500,
    RJ: 6500,
    MG: 6500,
    PR: 6500,
    ES: 8500,
    SC: 8500,
    RS: 8500,
    DF: 8500,
    GO: 8500,
    MS: 8500,
  }),
);

// A cidade do endereço é texto livre (RF05): compara sem acento, maiúsculas nem espaços nas pontas.
function semAcento(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

export function calcularFrete(
  modalidade: ModalidadeFrete,
  endereco: { cidade: string; uf: string },
): number | null {
  if (modalidade === "RETIRADA") return 0;
  if (endereco.uf === "SP" && semAcento(endereco.cidade) === "sao paulo")
    return FRETE_CAPITAL_SP_CENTAVOS;
  return FRETE_POR_UF_CENTAVOS.get(endereco.uf) ?? null;
}
