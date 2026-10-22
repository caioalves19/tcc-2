// Imagens ilustrativas geradas por IA (Pollinations.ai) para os dados de demonstração.
// gerar.ts baixa cada prompt para imagens/; popular.ts publica os arquivos (R2 ou public/) e grava no banco.

export type ImagemObra = {
  slug: string; // slug da obra já cadastrada
  textoAlternativo: string;
  prompt: string;
};

export type Tatuagem = {
  id: string; // fixo: repetir popular.ts não duplica
  artistaSlug: string;
  estiloSlug: string;
  titulo: string;
  descricao: string;
  regiaoCorpo: string;
  duracaoMinutos: number;
  destaque: boolean;
  prompt: string;
};

const OBRA =
  "the artwork photographed flat and straight on, filling the frame, no text, no signature";
const TATUAGEM =
  "professional tattoo portfolio photo, close-up of a healed tattoo on real skin, soft studio light, sharp focus, no text";

export const obras: ImagemObra[] = [
  {
    slug: "demo-estudo-de-maos",
    textoAlternativo: "Desenho a grafite de mãos em gestos diferentes sobre papel texturizado.",
    prompt: `graphite pencil study of human hands in several gestures on textured cream paper, fine cross-hatching, sketchbook page, ${OBRA}`,
  },
  {
    slug: "demo-noturno-em-azul",
    textoAlternativo:
      "Pintura em acrílica de telhados da cidade à noite em tons de azul, com a lua.",
    prompt: `acrylic painting of Sao Paulo rooftops at night in deep blue tones, full moon, lit windows, expressive brushstrokes, ${OBRA}`,
  },
  {
    slug: "demo-raizes",
    textoAlternativo: "Pintura a óleo de raízes de árvore entrelaçadas na terra, em ocre e marrom.",
    prompt: `oil painting on canvas of large intertwined tree roots gripping red earth, warm ochre and brown palette, thick impasto, ${OBRA}`,
  },
  {
    slug: "demo-mare-baixa",
    textoAlternativo:
      "Pintura a óleo de praia na maré baixa, com barcos de pesca na areia molhada.",
    prompt: `oil painting of a Brazilian beach at low tide, small wooden fishing boats resting on wet sand, soft morning light, ${OBRA}`,
  },
  {
    slug: "demo-serie-varandas",
    textoAlternativo: "Esboço a nanquim de varandas antigas com grades de ferro trabalhado.",
    prompt: `loose india ink sketch of old colonial balconies with wrought iron railings and potted plants, pen lines on white paper, ${OBRA}`,
  },
  {
    slug: "demo-minhocao",
    textoAlternativo:
      "Aquarela do Elevado Minhocão ao entardecer, com pessoas caminhando sob o céu laranja.",
    prompt: `watercolor painting of the Minhocao elevated highway in Sao Paulo at sunset, people walking on it, warm orange sky, loose washes, ${OBRA}`,
  },
  {
    slug: "demo-feira-de-domingo",
    textoAlternativo: "Aquarela de feira de rua num domingo, com barracas coloridas de frutas.",
    prompt: `watercolor painting of a Sunday street market in Sao Paulo, colorful fruit stalls with striped awnings, shoppers, loose washes, ${OBRA}`,
  },
  {
    slug: "demo-avenida-paulista",
    textoAlternativo: "Aquarela da Avenida Paulista com prédios altos, árvores e trânsito.",
    prompt: `loose watercolor painting of Avenida Paulista in Sao Paulo, tall buildings, trees along the sidewalk, traffic, wet-on-wet sky, ${OBRA}`,
  },
];

export const tatuagens: Tatuagem[] = [
  {
    id: "00000000-0000-4000-9000-000000000001",
    artistaSlug: "demo-marina-duarte",
    estiloSlug: "demo-traco-fino",
    titulo: "Ramo de oliveira",
    descricao: "Ramo delicado em traço fino acompanhando o antebraço.",
    regiaoCorpo: "Antebraço",
    duracaoMinutos: 90,
    destaque: true,
    prompt: `fine line single needle tattoo of a slender olive branch along the inner forearm, ${TATUAGEM}`,
  },
  {
    id: "00000000-0000-4000-9000-000000000002",
    artistaSlug: "demo-marina-duarte",
    estiloSlug: "demo-traco-fino",
    titulo: "Constelação de Escorpião",
    descricao: "Pontos e linhas finas formando a constelação.",
    regiaoCorpo: "Clavícula",
    duracaoMinutos: 45,
    destaque: false,
    prompt: `minimalist fine line tattoo of the Scorpius constellation with tiny dots below the collarbone, ${TATUAGEM}`,
  },
  {
    id: "00000000-0000-4000-9000-000000000003",
    artistaSlug: "demo-marina-duarte",
    estiloSlug: "demo-traco-fino",
    titulo: "Gato em linha contínua",
    descricao: "Gato desenhado numa única linha, sem tirar a agulha.",
    regiaoCorpo: "Tornozelo",
    duracaoMinutos: 40,
    destaque: false,
    prompt: `fine line tattoo of a cat drawn in one continuous line on the outer ankle, ${TATUAGEM}`,
  },
  {
    id: "00000000-0000-4000-9000-000000000004",
    artistaSlug: "demo-marina-duarte",
    estiloSlug: "demo-aquarela",
    titulo: "Beija-flor",
    descricao: "Beija-flor com manchas de aquarela em verde e azul.",
    regiaoCorpo: "Ombro",
    duracaoMinutos: 180,
    destaque: true,
    prompt: `watercolor style tattoo of a hummingbird with green and turquoise paint splashes on the shoulder, ${TATUAGEM}`,
  },
  {
    id: "00000000-0000-4000-9000-000000000005",
    artistaSlug: "demo-marina-duarte",
    estiloSlug: "demo-aquarela",
    titulo: "Ipê amarelo",
    descricao: "Galho de ipê florido com respingos amarelos.",
    regiaoCorpo: "Panturrilha",
    duracaoMinutos: 150,
    destaque: false,
    prompt: `watercolor style tattoo of a yellow ipe tree branch in bloom with yellow paint drips on the calf, ${TATUAGEM}`,
  },
  {
    id: "00000000-0000-4000-9000-000000000006",
    artistaSlug: "demo-marina-duarte",
    estiloSlug: "demo-aquarela",
    titulo: "Carpa",
    descricao: "Carpa em laranja e vermelho com aguadas suaves.",
    regiaoCorpo: "Costela",
    duracaoMinutos: 210,
    destaque: false,
    prompt: `watercolor style tattoo of an orange and red koi fish with soft color washes on the side ribs, ${TATUAGEM}`,
  },
  {
    id: "00000000-0000-4000-9000-000000000007",
    artistaSlug: "artista-exemplo",
    estiloSlug: "demo-blackwork",
    titulo: "Mandala geométrica",
    descricao: "Mandala em blackwork com pontilhismo entre as escápulas.",
    regiaoCorpo: "Costas",
    duracaoMinutos: 300,
    destaque: true,
    prompt: `blackwork tattoo of a symmetrical geometric mandala with dotwork shading on the upper back between the shoulder blades, ${TATUAGEM}`,
  },
  {
    id: "00000000-0000-4000-9000-000000000008",
    artistaSlug: "artista-exemplo",
    estiloSlug: "demo-blackwork",
    titulo: "Bracelete ornamental",
    descricao: "Faixa ornamental em preto sólido ao redor do antebraço.",
    regiaoCorpo: "Antebraço",
    duracaoMinutos: 120,
    destaque: false,
    prompt: `blackwork tattoo of an ornamental band with solid black filigree wrapping around the forearm, ${TATUAGEM}`,
  },
  {
    id: "00000000-0000-4000-9000-000000000009",
    artistaSlug: "artista-exemplo",
    estiloSlug: "demo-blackwork",
    titulo: "Corvo",
    descricao: "Corvo de asas abertas em preto sólido.",
    regiaoCorpo: "Coxa",
    duracaoMinutos: 240,
    destaque: false,
    prompt: `bold blackwork tattoo of a raven with spread wings in solid black ink on the thigh, ${TATUAGEM}`,
  },
];
