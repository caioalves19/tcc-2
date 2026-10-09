// Funções puras dos pedidos que podem ir para o navegador (sem banco), como o cliente.ts do
// catálogo. Componentes "use client" importam daqui, não do index.
export { aceitaRastreio, proximasSituacoes, rotuloDoAndamento, rotuloSituacao } from "./regras";
export type { SituacaoCliente, SituacaoDoAndamento } from "./regras";
