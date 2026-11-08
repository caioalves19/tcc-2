// APS (qualidade): dados fixos da carga, lidos pelo servidor (Node) e espelhados nos scripts k6.
export const PORTA_CARGA = 3100;

// Estoque alto: o checkout sob carga mede tempo de resposta sem esgotar.
export const OBRA_CARGA = {
  id: "00000000-0000-4000-9000-0000000000c1",
  titulo: "Carga em Ocre",
  slug: "carga-em-ocre",
  precoCentavos: 15_000,
};

// Estoque 1: a rajada concorrente só pode reservar uma vez (RN de estoque único).
export const OBRA_RAJADA = {
  id: "00000000-0000-4000-9000-0000000000c2",
  titulo: "Rajada em Vermelho",
  slug: "rajada-em-vermelho",
  precoCentavos: 25_000,
};
