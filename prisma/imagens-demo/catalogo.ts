// Dados de demonstração com o pessoal e o trabalho real do Kolô. As fotos vêm dos posts do
// Instagram de cada artista (campo `origem`), usadas com autorização deles, e ficam em imagens/.
// ../seed-demo.ts grava artistas, estilos e obras; popular.ts publica as imagens (R2 ou public/)
// e grava as tatuagens. Preço e estoque das obras são fictícios.

export type ArtistaDemo = {
  email: string;
  nome: string;
  slug: string;
  instagram: string;
  estilos: string[];
  // Senha de demonstração (só no .env, nunca no repositório); vazia = conta sem login.
  variavelSenha: string;
};

export type EstiloDemo = { slug: string; nome: string; descricao: string };

// Cadastro que o seed de demonstração grava; a imagem é imagens/obras/<slug>.webp.
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
  textoAlternativo: string;
  origem: string; // post do Instagram de onde veio a foto
};

// Trabalho do portfólio; a imagem é imagens/tatuagens/<id>.webp.
export type Tatuagem = {
  id: string; // fixo: repetir popular.ts não duplica
  artistaSlug: string;
  estiloSlug: string;
  titulo: string;
  descricao: string;
  regiaoCorpo: string;
  duracaoMinutos: number; // fictícia
  destaque: boolean;
  origem: string;
};

// Vai ao fim da descrição das obras: as obras são reais, a venda não.
export const AVISO_DEMO = "Demonstração: preço e disponibilidade fictícios.";

// Quem tem estilo tatua e aparece no agendamento (RF20); o Rafael é só artista plástico. Sem bio
// até eles mandarem um texto.
export const artistasDemo: ArtistaDemo[] = [
  {
    email: "melanie@kolo.test",
    nome: "Melanie Schwark",
    slug: "melanie-schwark",
    instagram: "melanfetamina",
    variavelSenha: "SEED_SENHA_MELANIE",
    estilos: ["blackwork", "surrealismo"],
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
    estilos: ["blackwork", "old-school"],
  },
  {
    email: "pucca@kolo.test",
    nome: 'Laura Manoel "Pucca"',
    slug: "pucca",
    instagram: "pucca.ink",
    variavelSenha: "SEED_SENHA_PUCCA",
    estilos: ["lettering"],
  },
];

export const estilosDemo: EstiloDemo[] = [
  { slug: "blackwork", nome: "Blackwork", descricao: "Preto sólido, contraste e traço marcado." },
  {
    slug: "surrealismo",
    nome: "Surrealismo",
    descricao: "Figuras e cenas oníricas, misturando o real e o imaginário.",
  },
  {
    slug: "old-school",
    nome: "Old school",
    descricao: "Contorno grosso e desenho direto da tatuagem tradicional.",
  },
  { slug: "lettering", nome: "Lettering", descricao: "Palavras e frases em letras desenhadas." },
];

const MELANIE = "https://www.instagram.com/melanfetamina/p";
const RAFAEL = "https://www.instagram.com/rafa.lotufo/p";
const COGU = "https://www.instagram.com/co.guh/p";
const PUCCA = "https://www.instagram.com/pucca.ink/p";

export const obrasDemo: ObraDemo[] = [
  {
    slug: "melanie-cavalo",
    artistaSlug: "melanie-schwark",
    titulo: "Cavalo",
    descricao:
      "Figura com cabeça de cavalo, de camiseta e jeans, ao lado de um cavalo de crina azul.",
    tecnica: "Acrílica sobre tela",
    dimensoes: "40 × 50 cm",
    ano: 2025,
    precoCentavos: 280_000,
    estoque: 1,
    destaque: true,
    textoAlternativo:
      "Pintura de uma figura com cabeça de cavalo, camiseta branca e jeans, ao lado de um cavalo escuro de crina azul.",
    origem: `${MELANIE}/DPb6_gsjoFD/`,
  },
  {
    slug: "melanie-o-fruto-proibido",
    artistaSlug: "melanie-schwark",
    titulo: "O Fruto Proibido",
    descricao: "Eva e a maçã mordida, numa releitura sobre conhecimento e livre-arbítrio.",
    tecnica: "Ilustração sobre gravura",
    dimensoes: "30 × 40 cm",
    ano: 2026,
    precoCentavos: 90_000,
    estoque: 3,
    destaque: false,
    textoAlternativo:
      "Ilustração em preto e branco de maçãs mordidas em forma de corpo, sobre gravura antiga de Eva.",
    origem: `${MELANIE}/Dcln27Xlpsp/`,
  },
  {
    slug: "melanie-estudo-cavalo-humano",
    artistaSlug: "melanie-schwark",
    titulo: "Estudo de anatomia Cavalo-Humano",
    descricao:
      "Esqueleto de uma criatura cavalo-humana desenhada para fazer sentido anatomicamente.",
    tecnica: "Grafite sobre papel",
    dimensoes: "29,7 × 42 cm",
    ano: 2026,
    precoCentavos: 120_000,
    estoque: 1,
    destaque: false,
    textoAlternativo:
      "Desenho a grafite do esqueleto de uma criatura com corpo de cavalo e crânio humano, com anotações.",
    origem: `${MELANIE}/DUI8QJtjtI7/`,
  },
  {
    slug: "rafael-preterito",
    artistaSlug: "rafael-lotufo",
    titulo: "Pretérito",
    descricao: "Jogador de futebol de colete laranja dominando a bola num campo de terra.",
    tecnica: "Óleo sobre algodão",
    dimensoes: "80 × 60 cm",
    ano: 2026,
    precoCentavos: 420_000,
    estoque: 1,
    destaque: true,
    textoAlternativo:
      "Pintura de um jogador de chapéu e colete laranja dominando a bola, sobre fundo laranja.",
    origem: `${RAFAEL}/DbV1ASoxf9S/`,
  },
  {
    slug: "rafael-eclipse",
    artistaSlug: "rafael-lotufo",
    titulo: "Eclipse",
    descricao: "O carro verde-limão de corrida das telas, com o asfalto molhado refletindo a cor.",
    tecnica: "Óleo sobre tela",
    dimensoes: "100 × 60 cm",
    ano: 2026,
    precoCentavos: 380_000,
    estoque: 1,
    destaque: false,
    textoAlternativo:
      "Pintura de um carro esportivo verde-limão com detalhes azuis, num cavalete do ateliê.",
    origem: `${RAFAEL}/Dfry1sIIGOc/`,
  },
  {
    slug: "rafael-sao-jorge",
    artistaSlug: "rafael-lotufo",
    titulo: "São Jorge",
    descricao: "O santo guerreiro no cavalo branco, vencendo o dragão.",
    tecnica: "Óleo sobre tela",
    dimensoes: "50 × 40 cm",
    ano: 2026,
    precoCentavos: 240_000,
    estoque: 1,
    destaque: false,
    textoAlternativo:
      "Pintura de São Jorge de armadura e capa vermelha, num cavalo branco sobre o dragão.",
    origem: `${RAFAEL}/DU_Dn2YkZQU/`,
  },
  {
    slug: "cogu-zoe",
    artistaSlug: "cogu",
    titulo: "Zoe",
    descricao: "Retrato de uma pequena Boston terrier, feito sob encomenda.",
    tecnica: "Acrílica sobre tela",
    dimensoes: "30 × 40 cm",
    ano: 2026,
    precoCentavos: 120_000,
    estoque: 0,
    destaque: false,
    textoAlternativo: "Pintura de uma Boston terrier preta e branca sentada, em tons de lilás.",
    origem: `${COGU}/DdiIgvUDIBR/`,
  },
];

const tatuagem = (n: number) => `00000000-0000-4000-9100-${String(n).padStart(12, "0")}`;

export const tatuagens: Tatuagem[] = [
  {
    id: tatuagem(1),
    artistaSlug: "melanie-schwark",
    estiloSlug: "blackwork",
    titulo: "Cavalo empinado",
    descricao: "Cavalo empinado com uma estrela no peito.",
    regiaoCorpo: "Coxa",
    duracaoMinutos: 240,
    destaque: true,
    origem: `${MELANIE}/DWzn7xgFpe9/`,
  },
  {
    id: tatuagem(2),
    artistaSlug: "melanie-schwark",
    estiloSlug: "surrealismo",
    titulo: "Lhama",
    descricao: "Lhama mágica e ancestral, criada para representar raízes bolivianas.",
    regiaoCorpo: "Antebraço",
    duracaoMinutos: 210,
    destaque: false,
    origem: `${MELANIE}/Da3j_qsFhdh/`,
  },
  {
    id: tatuagem(3),
    artistaSlug: "melanie-schwark",
    estiloSlug: "blackwork",
    titulo: "Camaleão",
    descricao: "Camaleão sobre um galho, com textura em traço preto.",
    regiaoCorpo: "Coxa",
    duracaoMinutos: 180,
    destaque: false,
    origem: `${MELANIE}/DUTw1O4j1pv/`,
  },
  {
    id: tatuagem(4),
    artistaSlug: "melanie-schwark",
    estiloSlug: "surrealismo",
    titulo: "Máscaras",
    descricao: "Três máscaras entre cactos e folhagens.",
    regiaoCorpo: "Ombro",
    duracaoMinutos: 300,
    destaque: false,
    origem: `${MELANIE}/DUB3GOljzgo/`,
  },
  {
    id: tatuagem(5),
    artistaSlug: "cogu",
    estiloSlug: "blackwork",
    titulo: "Lobo em pele de cordeiro",
    descricao: "Lobo com pele de cordeiro, em preto e cinza.",
    regiaoCorpo: "Costas",
    duracaoMinutos: 240,
    destaque: true,
    origem: `${COGU}/DXxTIyZGKmN/`,
  },
  {
    id: tatuagem(6),
    artistaSlug: "cogu",
    estiloSlug: "old-school",
    titulo: "Cão bravo",
    descricao: "Cão bravo saindo de uma porta em arco, desenho dos disponíveis.",
    regiaoCorpo: "Braço",
    duracaoMinutos: 150,
    destaque: false,
    origem: `${COGU}/DXh4tk0D39U/`,
  },
  {
    id: tatuagem(7),
    artistaSlug: "pucca",
    estiloSlug: "lettering",
    titulo: "Amor",
    descricao: "Lettering com arabescos e uma estrela.",
    regiaoCorpo: "Antebraço",
    duracaoMinutos: 180,
    destaque: true,
    origem: `${PUCCA}/DV1LUFsDjaV/`,
  },
  {
    id: tatuagem(8),
    artistaSlug: "pucca",
    estiloSlug: "lettering",
    titulo: "Próspera",
    descricao: "Palavra que carrega movimento, crescimento e intenção.",
    regiaoCorpo: "Coxa",
    duracaoMinutos: 120,
    destaque: false,
    origem: `${PUCCA}/DUlT9i2jtR2/`,
  },
  {
    id: tatuagem(9),
    artistaSlug: "pucca",
    estiloSlug: "lettering",
    titulo: "Kaizen",
    descricao: "Kai e Zen: mudança, fluxo e evolução constante.",
    regiaoCorpo: "Antebraço",
    duracaoMinutos: 120,
    destaque: false,
    origem: `${PUCCA}/DVghg-MDiNZ/`,
  },
  {
    id: tatuagem(10),
    artistaSlug: "pucca",
    estiloSlug: "lettering",
    titulo: "Herege",
    descricao: "Palavra que carrega ruptura, questionamento e coragem.",
    regiaoCorpo: "Coxa",
    duracaoMinutos: 120,
    destaque: false,
    origem: `${PUCCA}/DWSCkVQFHde/`,
  },
];

// Demonstrações anteriores, que o seed tira do banco: a artista fictícia, as obras, tatuagens e
// estilos com imagem gerada por IA.
export const ARTISTA_DEMO_ANTIGO = "demo-marina-duarte";
export const OBRAS_DEMO_ANTIGAS = [
  "demo-estudo-de-maos",
  "demo-noturno-em-azul",
  "demo-raizes",
  "demo-mare-baixa",
  "demo-serie-varandas",
  "demo-minhocao",
  "demo-feira-de-domingo",
  "demo-avenida-paulista",
];
export const TATUAGENS_DEMO_ANTIGAS = Array.from(
  { length: 9 },
  (_, i) => `00000000-0000-4000-9000-${String(i + 1).padStart(12, "0")}`,
);
export const ESTILOS_DEMO_ANTIGOS = ["demo-traco-fino", "demo-aquarela", "demo-blackwork"];
