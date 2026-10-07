"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  adicionarImagem,
  criarObra,
  definirImagemPrincipal,
  editarObra,
  editarTextoAlternativo,
  excluirObra,
  moverImagem,
  removerImagem,
} from "@/modules/catalog";
import type { EntradaEditarObra, EntradaObra } from "@/modules/catalog";
import type { ResultadoGestao } from "@/modules/artists";

// Arquivo próprio do PBI-18 para não disputar o actions.ts do PBI-16.
function revalidar<T extends ResultadoGestao<unknown>>(resultado: T): T {
  if (resultado.ok) revalidatePath("/admin/obras");
  return resultado;
}
export async function criarObraAcao(entrada: EntradaObra) {
  return revalidar(await criarObra(entrada, await headers()));
}
export async function editarObraAcao(entrada: EntradaEditarObra) {
  return revalidar(await editarObra(entrada, await headers()));
}
export async function excluirObraAcao(id: string) {
  return revalidar(await excluirObra(id, await headers()));
}
export async function adicionarImagemAcao(entrada: {
  obraId: string;
  chave: string;
  textoAlternativo: string;
}) {
  return revalidar(await adicionarImagem(entrada, await headers()));
}
export async function definirImagemPrincipalAcao(imagemId: string) {
  return revalidar(await definirImagemPrincipal(imagemId, await headers()));
}
export async function moverImagemAcao(imagemId: string, direcao: "antes" | "depois") {
  return revalidar(await moverImagem({ imagemId, direcao }, await headers()));
}
export async function editarTextoAlternativoAcao(imagemId: string, textoAlternativo: string) {
  return revalidar(await editarTextoAlternativo({ imagemId, textoAlternativo }, await headers()));
}
export async function removerImagemAcao(imagemId: string) {
  return revalidar(await removerImagem(imagemId, await headers()));
}
