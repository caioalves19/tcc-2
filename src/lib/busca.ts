// Busca textual do catálogo (PBI-41) e do portfólio (PBI-37): a mesma limpeza nos dois. Fica só
// com letras e números (sem os operadores do to_tsquery, como & | ! :*), até 100 caracteres e 8
// palavras. Sem palavra nenhuma, é como não ter busca.
export function palavrasDaBusca(texto: string): string[] {
  return (texto.slice(0, 100).match(/[\p{L}\p{N}]+/gu) ?? []).slice(0, 8);
}

// Consulta do to_tsquery com a configuração kolo_busca (migração 0006): cada palavra por começo
// ("metro" acha "Metrópole") e todas obrigatórias. As palavras já chegam limpas.
export function consultaDaBusca(palavras: string[]): string {
  return palavras.map((palavra) => `${palavra}:*`).join(" & ");
}
