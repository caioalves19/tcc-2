// Regras puras do catálogo, sem banco: servem ao CRUD (PBI-18) e a quem mexer no estoque
// depois (reserva e webhook, PBIs 25 e 28).

export type SituacaoObra = "RASCUNHO" | "DISPONIVEL" | "ESGOTADA";

// RN11: o admin só escolhe se a obra está publicada; disponível ou esgotada sai do estoque.
export function situacaoPorEstoque(publicada: boolean, estoque: number): SituacaoObra {
  if (!publicada) return "RASCUNHO";
  return estoque > 0 ? "DISPONIVEL" : "ESGOTADA";
}

// Reais no formato brasileiro: milhar com ponto (opcional) e até 2 casas depois da vírgula.
const PRECO = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/;

// RN07: preço vira centavos inteiros; null quando o texto não é um valor em reais.
export function precoEmCentavos(texto: string): number | null {
  const limpo = texto.trim().replace(/^R\$\s*/i, "");
  const partes = PRECO.exec(limpo);
  const inteiros = partes?.[1];
  if (inteiros === undefined) return null;
  const total =
    Number(inteiros.replace(/\./g, "")) * 100 + Number((partes?.[2] ?? "").padEnd(2, "0"));
  return Number.isSafeInteger(total) ? total : null;
}

// Caminho inverso, para preencher o formulário de edição: 123456 vira "1.234,56".
export function centavosParaTexto(centavos: number): string {
  const reais = String(Math.floor(centavos / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${reais},${String(centavos % 100).padStart(2, "0")}`;
}

export function formatarPreco(centavos: number): string {
  return `R$ ${centavosParaTexto(centavos)}`;
}

// Sugestão de slug para o formulário: "Ação & Reação" vira "acao-reacao".
export function slugDoTitulo(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// RF09: obras por página do catálogo público.
export const OBRAS_POR_PAGINA = 12;

// RF09: ordenações do catálogo público, na ordem em que aparecem no seletor.
export const ORDENS_CATALOGO = ["recentes", "menor-preco", "maior-preco", "destaque"] as const;
export type OrdemCatalogo = (typeof ORDENS_CATALOGO)[number];

export const ROTULOS_ORDEM: Record<OrdemCatalogo, string> = {
  recentes: "Mais recentes",
  "menor-preco": "Menor preço",
  "maior-preco": "Maior preço",
  destaque: "Destaque",
};

// Link de uma página do catálogo. Os padrões (recentes, página 1) ficam fora da URL.
export function hrefCatalogo(ordem: OrdemCatalogo, pagina = 1): string {
  const busca = new URLSearchParams();
  if (ordem !== "recentes") busca.set("ordem", ordem);
  if (pagina > 1) busca.set("pagina", String(pagina));
  const texto = busca.toString();
  return texto ? `/obras?${texto}` : "/obras";
}
