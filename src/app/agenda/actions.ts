"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  cadastrarHorario,
  editarHorario,
  mudarSituacaoHorario,
  type ResultadoAgenda,
} from "@/modules/scheduling";

// RF22: as actions só repassam a entrada e a sessão; quem valida e autoriza (RN10) é o módulo.
function revalidar<T extends ResultadoAgenda<unknown>>(resultado: T): T {
  if (resultado.ok) revalidatePath("/agenda");
  return resultado;
}

export async function cadastrarHorarioAcao(entrada: unknown) {
  return revalidar(await cadastrarHorario(entrada, await headers()));
}

export async function editarHorarioAcao(entrada: unknown) {
  return revalidar(await editarHorario(entrada, await headers()));
}

export async function mudarSituacaoHorarioAcao(entrada: unknown) {
  return revalidar(await mudarSituacaoHorario(entrada, await headers()));
}
