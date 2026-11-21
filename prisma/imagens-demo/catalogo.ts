// Imagens ilustrativas geradas por IA (Pollinations.ai) para os dados de demonstração.
// gerar.ts baixa cada prompt para imagens/; popular.ts publica os arquivos (R2 ou public/) e grava no banco.
// Também traz o cadastro (artista, estilos, obras) que ../seed-demo.ts grava antes do popular.ts.

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

// Cadastro que o seed de demonstração (prisma/seed-demo.ts) grava antes do popular.ts.
export type ObraDemo = {
  slug: string;
  artistaSlug: string;
  titulo: string;
  descricao: string;
  tecnica: string;
  dimensoes: string;
  ano: number;
  precoCentavos: number; // RN07
  estoque: number; // RN02; 0 deixa a obra esgotada (RN11)
  destaque: boolean;
};

export type EstiloDemo = { slug: string; nome: string; descricao: string };

// PBI-49: as imagens são ilustrativas, não obras do acervo real.
// Vai ao fim da descrição das obras (seed-demo.ts) e das tatuagens (popular.ts).
export const AVISO_DEMO = "Demonstração: imagem ilustrativa gerada por IA, fora do acervo real.";

// O pessoal do Kolô. Quem tem estilo tatua e aparece no agendamento (RF20); o Rafael é só
// artista plástico. Contas sem senha (ninguém entra com elas) e sem bio até eles mandarem.
// Enquanto as imagens reais não chegam, as ilustrativas abaixo ficam distribuídas entre eles.
export type ArtistaDemo = {
  email: string;
  nome: string;
  slug: string;
  instagram: string;
  estilos: string[];
  // Senha de demonstração (só no .env, nunca no repositório); vazia = conta sem login.
  variavelSenha: string;
};

export const artistasDemo: ArtistaDemo[] = [
  {
    email: "melanie@kolo.test",
    nome: "Melanie Schwark",
    slug: "melanie-schwark",
    instagram: "melanfetamina",
    variavelSenha: "SEED_SENHA_MELANIE",
    estilos: ["demo-traco-fino"],
  },
  {
    email: "rafael@kolo.test",
    nome: "Rafael Lotufo",
    slug: "rafael-lotufo",
    instagram: "rafa.lotufo",
    variavelSenha: "SEED_SENHA_RAFAEL",
    estilos: [],
  },
  {
    email: "cogu@kolo.test",
    nome: 'Gustavo Henrique "Cogu"',
    slug: "cogu",
    instagram: "co.guh",
    variavelSenha: "SEED_SENHA_COGU",
    estilos: ["demo-blackwork"],
  },
  {
    email: "pucca@kolo.test",
    nome: 'Laura Manoel "Pucca"',
    slug: "pucca",
    instagram: "pucca.ink",
    variavelSenha: "SEED_SENHA_PUCCA",
    estilos: ["demo-aquarela"],
  },
];

// Demonstrações anteriores: o seed tira estes da vitrine.
export const ARTISTA_DEMO_ANTIGO = "demo-marina-duarte";

export const estilosDemo: EstiloDemo[] = [
  {
    slug: "demo-traco-fino",
    nome: "Traço fino",
    descricao: "Linhas finas e delicadas, feitas com agulha única.",
  },
  {
    slug: "demo-aquarela",
    nome: "Aquarela",
    descricao: "Manchas e aguadas de cor que imitam a pintura em aquarela.",
  },
  {
    slug: "demo-blackwork",
    nome: "Blackwork",
    descricao: "Preto sólido, geometria e pontilhismo.",
  },
];

export const obrasDemo: ObraDemo[] = [
  {
    slug: "demo-estudo-de-maos",
    artistaSlug: "melanie-schwark",
    titulo: "Estudo de mãos",
    descricao: "Mãos em gestos diferentes, desenhadas a grafite.",
    tecnica: "Grafite sobre papel",
    dimensoes: "29,7 × 42 cm",
    ano: 2024,
    precoCentavos: 45_000,
    estoque: 1,
    destaque: false,
  },
  {
    slug: "demo-noturno-em-azul",
    artistaSlug: "rafael-lotufo",
    titulo: "Noturno em azul",
    descricao: "Telhados da cidade à noite, sob a lua cheia.",
    tecnica: "Acrílica sobre tela",
    dimensoes: "60 × 80 cm",
    ano: 2025,
    precoCentavos: 280_000,
    estoque: 1,
    destaque: true,
  },
  {
    slug: "demo-raizes",
    artistaSlug: "rafael-lotufo",
    titulo: "Raízes",
    descricao: "Raízes entrelaçadas na terra vermelha, em empastes de ocre e marrom.",
    tecnica: "Óleo sobre tela",
    dimensoes: "70 × 100 cm",
    ano: 2023,
    precoCentavos: 420_000,
    estoque: 0,
    destaque: false,
  },
  {
    slug: "demo-mare-baixa",
    artistaSlug: "cogu",
    titulo: "Maré baixa",
    descricao: "Barcos de pesca na areia molhada, na luz da manhã.",
    tecnica: "Óleo sobre tela",
    dimensoes: "50 × 70 cm",
    ano: 2024,
    precoCentavos: 350_000,
    estoque: 1,
    destaque: true,
  },
  {
    slug: "demo-serie-varandas",
    artistaSlug: "melanie-schwark",
    titulo: "Série Varandas",
    descricao: "Varandas antigas com grades de ferro trabalhado, a nanquim.",
    tecnica: "Nanquim sobre papel",
    dimensoes: "21 × 29,7 cm",
    ano: 2025,
    precoCentavos: 32_000,
    estoque: 3,
    destaque: false,
  },
  {
    slug: "demo-minhocao",
    artistaSlug: "cogu",
    titulo: "Minhocão",
    descricao: "O Elevado ao entardecer, com gente caminhando sob o céu laranja.",
    tecnica: "Aquarela sobre papel",
    dimensoes: "30 × 40 cm",
    ano: 2025,
    precoCentavos: 120_000,
    estoque: 1,
    destaque: true,
  },
  {
    slug: "demo-feira-de-domingo",
    artistaSlug: "pucca",
    titulo: "Feira de domingo",
    descricao: "Barracas de frutas com toldos listrados numa feira de rua.",
    tecnica: "Aquarela sobre papel",
    dimensoes: "30 × 40 cm",
    ano: 2024,
    precoCentavos: 98_000,
    estoque: 1,
    destaque: false,
  },
  {
    slug: "demo-avenida-paulista",
    artistaSlug: "pucca",
    titulo: "Avenida Paulista",
    descricao: "Prédios, árvores e trânsito da avenida em aguadas soltas.",
    tecnica: "Aquarela sobre papel",
    dimensoes: "36 × 48 cm",
    ano: 2025,
    precoCentavos: 150_000,
    estoque: 2,
    destaque: false,
  },
];

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
    artistaSlug: "melanie-schwark",
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
    artistaSlug: "melanie-schwark",
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
    artistaSlug: "melanie-schwark",
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
    artistaSlug: "pucca",
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
    artistaSlug: "pucca",
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
    artistaSlug: "pucca",
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
    artistaSlug: "cogu",
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
    artistaSlug: "cogu",
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
    artistaSlug: "cogu",
    estiloSlug: "demo-blackwork",
    titulo: "Corvo",
    descricao: "Corvo de asas abertas em preto sólido.",
    regiaoCorpo: "Coxa",
    duracaoMinutos: 240,
    destaque: false,
    prompt: `bold blackwork tattoo of a raven with spread wings in solid black ink on the thigh, ${TATUAGEM}`,
  },
];
