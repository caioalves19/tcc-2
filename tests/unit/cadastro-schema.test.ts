import { describe, expect, it } from "vitest";

import { validarCadastro } from "@/modules/identity";

const VALIDO = {
  nome: "Maria Silva",
  email: "maria@kolo.test",
  telefone: "(11) 98765-4321",
  senha: "senha-segura",
};

describe("validação do cadastro de cliente (RF01)", () => {
  it("aceita telefone com máscara e guarda só os dígitos", () => {
    const resultado = validarCadastro(VALIDO);

    expect(resultado).toEqual({
      ok: true,
      dados: {
        nome: "Maria Silva",
        email: "maria@kolo.test",
        telefone: "11987654321",
        senha: "senha-segura",
      },
    });
  });

  it("normaliza o e-mail para minúsculo e tira espaços do nome", () => {
    const resultado = validarCadastro({ ...VALIDO, nome: "  Maria  ", email: "Maria@Kolo.TEST" });

    expect(resultado.ok && resultado.dados.email).toBe("maria@kolo.test");
    expect(resultado.ok && resultado.dados.nome).toBe("Maria");
  });

  it("aceita fixo com DDD (10 dígitos)", () => {
    expect(validarCadastro({ ...VALIDO, telefone: "1133334444" }).ok).toBe(true);
  });

  it.each([
    ["email", { email: "maria-sem-arroba" }],
    ["senha", { senha: "1234567" }],
    ["telefone", { telefone: "119876543" }],
    ["telefone", { telefone: "119876543210" }],
    ["nome", { nome: " M " }],
  ] as const)("recusa %s inválido", (campo, parcial) => {
    const resultado = validarCadastro({ ...VALIDO, ...parcial });

    expect(resultado.ok).toBe(false);
    expect(!resultado.ok && Object.keys(resultado.campos)).toEqual([campo]);
  });

  it("recusa senha acima de 128 caracteres", () => {
    expect(validarCadastro({ ...VALIDO, senha: "a".repeat(129) }).ok).toBe(false);
  });
});
