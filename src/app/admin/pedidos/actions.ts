"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { mudarSituacaoPedido, registrarRastreio } from "@/modules/orders";
import type { ResultadoGestao } from "@/modules/artists";

// RF29 (PBI-30): o módulo confere sessão, papel e transição; aqui só se repassa e atualiza a tela.
function revalidar<T extends ResultadoGestao<unknown>>(resultado: T): T {
  if (resultado.ok) revalidatePath("/admin/pedidos", "layout");
  return resultado;
}
export async function mudarSituacaoAcao(entrada: { numero: string; de: string; para: string }) {
  return revalidar(await mudarSituacaoPedido(entrada, await headers()));
}
export async function registrarRastreioAcao(entrada: { numero: string; codigo: string }) {
  return revalidar(await registrarRastreio(entrada, await headers()));
}
