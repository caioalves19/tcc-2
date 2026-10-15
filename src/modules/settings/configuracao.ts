import { z } from "zod";

// RF31 (PBI-39): o que o ADMIN configura no site. Regras puras, sem banco: validação da entrada,
// valores padrão e a leitura do que está salvo em site_setting (uma linha por chave).

export type ConfiguracaoSite = {
  contato: {
    email: string;
    // Só dígitos, com 55 e DDD: é o que vai no wa.me.
    whatsapp: string;
    // Perfis sem o @.
    instagramAtelie: string;
    instagramTattoo: string;
  };
  // Até 4 linhas curtas; sem horário salvo, a seção não aparece.
  horarios: string[];
  textos: { apresentacao: string; tatuagem: string; murais: string; rodape: string };
};

// Os valores de antes do PBI-39: o site funciona igual enquanto o ADMIN não salvar nada.
export const PADRAO: ConfiguracaoSite = {
  contato: {
    email: "ateliekolo@gmail.com",
    whatsapp: "5511950901191",
    instagramAtelie: "koloatelie",
    instagramTattoo: "kolotattoo",
  },
  horarios: [],
  textos: {
    apresentacao:
      "O Kolô reúne um ateliê de arte urbana, com telas, murais e customizações, e um estúdio de tatuagem. As obras do catálogo vêm direto dos nossos artistas.",
    tatuagem: "Um espaço para trocar ideia, criar e tatuar com tranquilidade.",
    murais:
      "Murais sob encomenda para casas, empresas, restaurantes e fachadas, criados pelos artistas do Kolô.",
    rodape: "Arte urbana autêntica, feita por pessoas reais. São Paulo.",
  },
};

export const CHAVES = ["contato", "horarios", "textos"] as const;
export type ChaveConfiguracao = (typeof CHAVES)[number];

const perfil = (nome: string) =>
  z
    .string()
    .trim()
    .transform((valor) => valor.replace(/^@/, "").toLowerCase())
    .pipe(
      z
        .string()
        .regex(
          /^[a-z0-9._]{1,30}$/,
          `Instagram ${nome}: até 30 letras, números, ponto ou sublinhado, sem espaço.`,
        ),
    );

const schemaContato = z.strictObject({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "E-mail longo demais.")
    .pipe(z.email("Informe um e-mail válido.")),
  whatsapp: z
    .string()
    .transform((valor) => valor.replace(/\D/g, ""))
    .pipe(
      z
        .string()
        .regex(/^55\d{10,11}$/, "Informe o WhatsApp com 55, DDD e número (ex.: 55 11 95090-1191)."),
    ),
  instagramAtelie: perfil("do ateliê"),
  instagramTattoo: perfil("do tattoo"),
});

const LINHA_HORARIO = z.string().max(60, "Cada linha de horário pode ter até 60 caracteres.");
const MAXIMO_HORARIOS = "Informe no máximo 4 linhas de horário.";
const schemaHorariosSalvos = z.array(LINHA_HORARIO.min(1)).max(4, MAXIMO_HORARIOS);

// Sem HTML: o texto é mostrado como texto (o React escapa), e um "<" indica cópia de outro lugar.
const texto = (nome: string, maximo: number) =>
  z
    .string()
    .trim()
    .min(10, `${nome}: escreva ao menos 10 caracteres.`)
    .max(maximo, `${nome}: até ${maximo} caracteres.`)
    .regex(/^[^<>]*$/, `${nome}: não use < nem >.`);

const schemaTextos = z.strictObject({
  apresentacao: texto("Apresentação da home", 400),
  tatuagem: texto("Frase do bloco de tatuagem", 200),
  murais: texto("Texto da faixa de murais", 400),
  rodape: texto("Frase do rodapé", 160),
});

// O formulário manda os horários num texto só, uma linha por item; linhas vazias são ignoradas.
export const schemaEntradaConfiguracao = z.strictObject({
  contato: schemaContato,
  horarios: z
    .string()
    .max(400, MAXIMO_HORARIOS)
    .transform((valor) =>
      valor
        .split(/\r?\n/)
        .map((linha) => linha.trim())
        .filter(Boolean),
    )
    .pipe(schemaHorariosSalvos),
  textos: schemaTextos,
});
export type EntradaConfiguracao = z.input<typeof schemaEntradaConfiguracao>;

const SCHEMA_SALVO = {
  contato: schemaContato,
  horarios: schemaHorariosSalvos,
  textos: schemaTextos,
} satisfies Record<ChaveConfiguracao, z.ZodType>;

// Cada chave salva substitui o padrão só se ainda for válida: um valor corrompido (ou de uma
// versão antiga) não derruba o rodapé nem as páginas.
export function configuracaoDoBanco(linhas: { chave: string; valor: unknown }[]): ConfiguracaoSite {
  const configuracao: ConfiguracaoSite = structuredClone(PADRAO);
  for (const { chave, valor } of linhas) {
    if (!(CHAVES as readonly string[]).includes(chave)) continue;
    const lido = SCHEMA_SALVO[chave as ChaveConfiguracao].safeParse(valor);
    if (lido.success) Object.assign(configuracao, { [chave]: lido.data });
  }
  return configuracao;
}
