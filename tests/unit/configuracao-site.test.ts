import { describe, expect, it } from "vitest";
import {
  configuracaoDoBanco,
  PADRAO,
  schemaEntradaConfiguracao,
} from "../../src/modules/settings/configuracao";

const VALIDA = {
  contato: {
    email: " Contato@Kolo.Test ",
    whatsapp: "+55 (11) 95090-1191",
    instagramAtelie: "@KoloAtelie",
    instagramTattoo: "kolo.tattoo_sp",
  },
  horarios: "Ter a sex, 10h às 19h\r\n\r\n  Sáb, 10h às 16h  \n",
  textos: {
    apresentacao: "  Ateliê de arte urbana e estúdio de tatuagem em São Paulo.  ",
    tatuagem: "Um espaço para criar com calma.",
    murais: "Murais sob encomenda para casas e empresas.",
    rodape: "Arte urbana feita por pessoas reais.",
  },
};

describe("RF31: o que o ADMIN pode salvar", () => {
  it("normaliza e-mail, WhatsApp (só dígitos), Instagram (sem @) e horários (uma linha por item)", () => {
    expect(schemaEntradaConfiguracao.parse(VALIDA)).toEqual({
      contato: {
        email: "contato@kolo.test",
        whatsapp: "5511950901191",
        instagramAtelie: "koloatelie",
        instagramTattoo: "kolo.tattoo_sp",
      },
      horarios: ["Ter a sex, 10h às 19h", "Sáb, 10h às 16h"],
      textos: {
        apresentacao: "Ateliê de arte urbana e estúdio de tatuagem em São Paulo.",
        tatuagem: "Um espaço para criar com calma.",
        murais: "Murais sob encomenda para casas e empresas.",
        rodape: "Arte urbana feita por pessoas reais.",
      },
    });
    expect(schemaEntradaConfiguracao.parse({ ...VALIDA, horarios: "  " }).horarios).toEqual([]);
  });

  it.each([
    ["e-mail inválido", { contato: { ...VALIDA.contato, email: "sem-arroba" } }],
    ["WhatsApp sem 55", { contato: { ...VALIDA.contato, whatsapp: "11 95090-1191" } }],
    ["WhatsApp curto", { contato: { ...VALIDA.contato, whatsapp: "55 11 9509" } }],
    ["Instagram com espaço", { contato: { ...VALIDA.contato, instagramAtelie: "kolo atelie" } }],
    ["Instagram longo", { contato: { ...VALIDA.contato, instagramTattoo: "a".repeat(31) } }],
    ["cinco linhas de horário", { horarios: "a\nb\nc\nd\ne" }],
    ["linha de horário longa", { horarios: "a".repeat(61) }],
    ["texto vazio", { textos: { ...VALIDA.textos, apresentacao: "   " } }],
    ["texto longo", { textos: { ...VALIDA.textos, rodape: "a".repeat(161) } }],
    ["campo a mais", { extra: "x" }],
    ["HTML no texto", { textos: { ...VALIDA.textos, murais: "Murais <script>x</script>" } }],
  ])("recusa %s", (_, alteracao) => {
    expect(schemaEntradaConfiguracao.safeParse({ ...VALIDA, ...alteracao }).success).toBe(false);
  });
});

describe("RF31: o que o site mostra", () => {
  it("sem nada salvo, usa os valores de hoje", () => {
    expect(configuracaoDoBanco([])).toEqual(PADRAO);
    expect(PADRAO.contato).toEqual({
      email: "ateliekolo@gmail.com",
      whatsapp: "5511950901191",
      instagramAtelie: "koloatelie",
      instagramTattoo: "kolotattoo",
    });
    expect(PADRAO.horarios).toEqual([]);
  });

  it("usa cada chave salva e volta ao padrão só na chave corrompida", () => {
    const salvo = schemaEntradaConfiguracao.parse(VALIDA);
    expect(
      configuracaoDoBanco([
        { chave: "contato", valor: salvo.contato },
        { chave: "horarios", valor: salvo.horarios },
        { chave: "textos", valor: { apresentacao: 42 } },
        { chave: "desconhecida", valor: "ignorada" },
      ]),
    ).toEqual({ contato: salvo.contato, horarios: salvo.horarios, textos: PADRAO.textos });
  });
});
