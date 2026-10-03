"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { atualizarPerfil, trocarSenha } from "@/lib/auth";
import type {
  EntradaPerfil,
  EntradaTrocaSenha,
  ResultadoPerfil,
  ResultadoTrocaSenha,
} from "@/modules/identity";

export async function atualizarPerfilAcao(entrada: EntradaPerfil): Promise<ResultadoPerfil> {
  const resultado = await atualizarPerfil(entrada, await headers());
  if (resultado.ok) revalidatePath("/conta");
  return resultado;
}

export async function trocarSenhaAcao(entrada: EntradaTrocaSenha): Promise<ResultadoTrocaSenha> {
  return trocarSenha(entrada, await headers());
}
