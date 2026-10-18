// RNF20/RNF21: problemas já conhecidos, registrados para corrigir em outro PR (Sprint-2, PBI-45,
// fatia 5). Cada exceção vale só para aquela tela, aquela regra e aquelas larguras. Uma violação
// fora da lista reprova a tela (inclusive a mesma regra em outra largura); uma exceção que deixou
// de acontecer em alguma das larguras também reprova, para ser ajustada aqui.
//
// A regra é o id do axe-core (ex.: "color-contrast") ou "rolagem-horizontal". O axe roda em 320
// e 1440 px; a rolagem é medida em 320, 768, 1440 e 1920 px. Limite conhecido: a chave não
// distingue o elemento, então outro elemento com a mesma regra, na mesma tela e largura, passa.

export type Excecao = { tela: string; regra: string; larguras: number[]; motivo: string };

export const EXCECOES: Excecao[] = [
  {
    tela: "admin detalhe do pedido",
    regra: "rolagem-horizontal",
    larguras: [320],
    motivo:
      "Em 320 px os títulos #admin-pedido-situacao e #admin-pedido-rastreio (fonte de exibição, " +
      "text-titulo-lg) e um botão passam da largura: 47 px de rolagem horizontal.",
  },
  {
    tela: "portfólio da artista",
    regra: "label-content-name-mismatch",
    larguras: [320, 1440],
    motivo: "Os mesmos botões de ordenar da tela de gestão do portfólio (ver a exceção abaixo).",
  },
  {
    tela: "portfólio pelo admin",
    regra: "label-content-name-mismatch",
    larguras: [320, 1440],
    motivo:
      'WCAG 2.5.3: os botões "Mover para cima" e "Mover para baixo" da lista do portfólio têm ' +
      'aria-label "Mover {título} para cima/baixo", que não contém o texto visível. Ex.: ' +
      'usar "Mover para cima: {título}".',
  },
];
