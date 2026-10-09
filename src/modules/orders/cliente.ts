// Funções puras dos pedidos que podem ir para o navegador (sem banco), como o cliente.ts do
// catálogo. Componentes "use client" importam daqui, não do index.
export { proximasSituacoes, rotuloSituacao } from "./regras";
export type { SituacaoCliente } from "./regras";
