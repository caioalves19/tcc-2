// Funções puras do catálogo que podem ir para o navegador (sem banco nem R2), como o
// cliente.ts do módulo media. Componentes "use client" importam daqui, não do index.
export {
  centavosParaTexto,
  formatarPreco,
  hrefCatalogo,
  OBRAS_POR_PAGINA,
  ORDENS_CATALOGO,
  ROTULOS_ORDEM,
  situacaoPorEstoque,
  slugDoTitulo,
} from "./regras";
export type { OrdemCatalogo, SituacaoObra } from "./regras";
