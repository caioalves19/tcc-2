// RNF20/RNF21: problemas já conhecidos, registrados para corrigir em outro PR (Sprint-2, PBI-45,
// fatia 5). Cada exceção vale só para aquela tela, aquela regra e aquelas larguras. Uma violação
// fora da lista reprova a tela (inclusive a mesma regra em outra largura); uma exceção que deixou
// de acontecer em alguma das larguras também reprova, para ser ajustada aqui.
//
// A regra é o id do axe-core (ex.: "color-contrast") ou "rolagem-horizontal". O axe roda em 320
// e 1440 px; a rolagem é medida em 320, 768, 1440 e 1920 px. Limite conhecido: a chave não
// distingue o elemento, então outro elemento com a mesma regra, na mesma tela e largura, passa.

export type Excecao = { tela: string; regra: string; larguras: number[]; motivo: string };

export const EXCECOES: Excecao[] = [];
