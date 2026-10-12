"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  criarTrabalho,
  editarTrabalho,
  moverTrabalho,
  removerTrabalho,
  type ResultadoPortfolio,
} from "@/modules/portfolio";

function revalidar<T extends ResultadoPortfolio<unknown>>(resultado: T): T {
  if (resultado.ok) revalidatePath("/portfolio/gestao");
  return resultado;
}
export async function criarTrabalhoAcao(entrada: unknown) {
  return revalidar(await criarTrabalho(entrada, await headers()));
}
export async function editarTrabalhoAcao(entrada: unknown) {
  return revalidar(await editarTrabalho(entrada, await headers()));
}
export async function moverTrabalhoAcao(entrada: unknown) {
  return revalidar(await moverTrabalho(entrada, await headers()));
}
export async function removerTrabalhoAcao(id: unknown) {
  return revalidar(await removerTrabalho(id, await headers()));
}
