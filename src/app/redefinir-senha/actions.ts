"use server";

import { redirect } from "next/navigation";

import { redefinirSenha } from "@/lib/auth";
import type { EntradaRedefinicao, FalhaRedefinicao } from "@/modules/identity";

export async function redefinirSenhaAcao(
  entrada: EntradaRedefinicao & { token: string },
): Promise<FalhaRedefinicao | undefined> {
  const resultado = await redefinirSenha(entrada);
  if (!resultado.ok) {
    return resultado;
  }
  // Todas as sessões caíram: a pessoa entra de novo com a senha nova.
  redirect("/login?senha=alterada");
}
