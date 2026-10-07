"use server";

import { redirect } from "next/navigation";

import { cadastrarCliente } from "@/lib/auth";
import type { EntradaCadastro, FalhaCadastro } from "@/modules/identity";

import { juntarCarrinhoDoVisitante } from "../carrinho/cookie";

// A validação roda de novo aqui: o que vem do navegador não é confiável.
// O cookie de sessão é gravado pelo plugin nextCookies do Better Auth.
export async function cadastrar(entrada: EntradaCadastro): Promise<FalhaCadastro | undefined> {
  const resultado = await cadastrarCliente(entrada);
  if (!resultado.ok) {
    return resultado;
  }
  // RF11: o que o visitante separou continua no carrinho da conta nova.
  await juntarCarrinhoDoVisitante(resultado.token);
  // TODO(PBI da área do cliente): trocar por /conta quando a rota existir.
  redirect("/");
}
