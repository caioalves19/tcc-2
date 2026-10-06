// Funções puras do catálogo que podem ir para o navegador (sem banco nem R2), como o
// cliente.ts do módulo media. Componentes "use client" importam daqui, não do index.
export { centavosParaTexto, formatarPreco, situacaoPorEstoque, slugDoTitulo } from "./regras";
export type { SituacaoObra } from "./regras";
