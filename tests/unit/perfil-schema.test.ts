import { expect, it } from "vitest";
import { validarPerfil } from "@/modules/identity";

it("RF04 valida nome e telefone com as regras do cadastro e remove campos extras", () => {
  expect(
    validarPerfil({ nome: " Maria Silva ", telefone: "(11) 98765-4321", role: "ADMIN" } as never),
  ).toEqual({ ok: true, dados: { nome: "Maria Silva", telefone: "11987654321" } });
  expect(validarPerfil({ nome: " ", telefone: "123" })).toEqual({
    ok: false,
    campos: { nome: "Informe seu nome.", telefone: "Informe o telefone com DDD." },
  });
});

it("RF04 exige senha atual, senha nova válida e confirmação igual", async () => {
  const { validarTrocaSenha } = await import("@/modules/identity");
  expect(validarTrocaSenha({ senhaAtual: "", senha: "curta", confirmacao: "outra" })).toMatchObject(
    {
      ok: false,
      campos: {
        senhaAtual: "Informe sua senha atual.",
        senha: "A senha precisa ter pelo menos 8 caracteres.",
        confirmacao: "As senhas não conferem.",
      },
    },
  );
  expect(
    validarTrocaSenha({
      senhaAtual: " atual ",
      senha: "nova-senha-123",
      confirmacao: "nova-senha-123",
    }),
  ).toEqual({
    ok: true,
    dados: { senhaAtual: " atual ", senha: "nova-senha-123", confirmacao: "nova-senha-123" },
  });
});
