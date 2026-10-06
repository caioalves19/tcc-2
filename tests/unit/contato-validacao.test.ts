import { describe, expect, it } from "vitest";

import { validarContato } from "@/modules/contact";

const VALIDO = {
  nome: "Maria Silva",
  email: "maria@kolo.test",
  mensagem: "Quero saber o horário de visitação do ateliê.",
  tokenTurnstile: "token-de-teste",
};

describe("validação do formulário de contato", () => {
  it("aceita nome, e-mail e mensagem e normaliza espaços e caixa do e-mail", () => {
    expect(
      validarContato({
        ...VALIDO,
        nome: "  Maria Silva  ",
        email: "Maria@Kolo.TEST",
        mensagem: "  Quero saber o horário de visitação do ateliê.  ",
      }),
    ).toEqual({
      ok: true,
      dados: {
        nome: "Maria Silva",
        email: "maria@kolo.test",
        mensagem: "Quero saber o horário de visitação do ateliê.",
        tokenTurnstile: "token-de-teste",
      },
    });
  });

  it.each([
    ["nome", { nome: " M " }, "Informe seu nome (mínimo de 2 caracteres)."],
    ["email", { email: "maria-sem-arroba" }, "Informe um e-mail válido."],
    ["mensagem", { mensagem: "curta" }, "Escreva uma mensagem (mínimo de 10 caracteres)."],
    ["tokenTurnstile", { tokenTurnstile: " " }, "Confirme que você não é um robô."],
  ] as const)("recusa %s inválido", (campo, parcial, mensagem) => {
    const resultado = validarContato({ ...VALIDO, ...parcial });
    expect(resultado).toEqual({ ok: false, campos: { [campo]: mensagem } });
  });

  it("recusa mensagem acima de 2000 caracteres", () => {
    expect(validarContato({ ...VALIDO, mensagem: "a".repeat(2001) })).toEqual({
      ok: false,
      campos: { mensagem: "A mensagem pode ter no máximo 2000 caracteres." },
    });
  });
});
