// RNF20/RNF21: problemas já conhecidos, registrados para corrigir em outro PR (Sprint-2, PBI-45,
// fatia 5). Cada exceção vale só para aquela tela e aquela regra. Uma violação fora da lista
// reprova a tela; uma exceção que deixou de acontecer também reprova, para ser apagada daqui.
//
// A regra é o id do axe-core (ex.: "color-contrast") ou "rolagem-horizontal".

export type Excecao = { tela: string; regra: string; motivo: string };

export const EXCECOES: Excecao[] = [
  {
    tela: "admin detalhe do pedido",
    regra: "rolagem-horizontal",
    motivo:
      "Em 320 px os títulos #admin-pedido-situacao e #admin-pedido-rastreio (fonte de exibição, " +
      "text-titulo-lg) e um botão passam da largura: 47 px de rolagem horizontal.",
  },
  {
    tela: "portfólio da artista",
    regra: "label-content-name-mismatch",
    motivo: "Os mesmos botões de ordenar da tela de gestão do portfólio (ver a exceção abaixo).",
  },
  {
    tela: "portfólio pelo admin",
    regra: "label-content-name-mismatch",
    motivo:
      'WCAG 2.5.3: os botões "Mover para cima" e "Mover para baixo" da lista do portfólio têm ' +
      'aria-label "Mover {título} para cima/baixo", que não contém o texto visível. Ex.: ' +
      'usar "Mover para cima: {título}".',
  },
];
