"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  criarArtista,
  editarArtista,
  excluirArtista,
  criarTaxonomia,
  editarTaxonomia,
  excluirTaxonomia,
} from "@/modules/artists";
import type {
  EntradaArtista,
  EntradaEditarArtista,
  EntradaTaxonomia,
  TipoTaxonomia,
  ResultadoGestao,
} from "@/modules/artists";

function revalidar(resultado: ResultadoGestao<unknown>) {
  if (resultado.ok) revalidatePath("/admin", "layout");
}
export async function criarArtistaAcao(entrada: EntradaArtista) {
  const resultado = await criarArtista(entrada, await headers());
  revalidar(resultado);
  return resultado;
}
export async function editarArtistaAcao(entrada: EntradaEditarArtista) {
  const resultado = await editarArtista(entrada, await headers());
  revalidar(resultado);
  return resultado;
}
export async function excluirArtistaAcao(id: string) {
  const resultado = await excluirArtista(id, await headers());
  revalidar(resultado);
  return resultado;
}
export async function salvarEstiloAcao(entrada: EntradaTaxonomia, id?: string) {
  return salvar("estilos", entrada, id);
}
export async function salvarTagAcao(entrada: EntradaTaxonomia, id?: string) {
  return salvar("tags", entrada, id);
}
async function salvar(tipo: TipoTaxonomia, entrada: EntradaTaxonomia, id?: string) {
  const cabecalhos = await headers();
  const resultado =
    id === undefined
      ? await criarTaxonomia(tipo, entrada, cabecalhos)
      : await editarTaxonomia(tipo, id, entrada, cabecalhos);
  revalidar(resultado);
  return resultado;
}
export async function excluirEstiloAcao(id: string) {
  const resultado = await excluirTaxonomia("estilos", id, await headers());
  revalidar(resultado);
  return resultado;
}
export async function excluirTagAcao(id: string) {
  const resultado = await excluirTaxonomia("tags", id, await headers());
  revalidar(resultado);
  return resultado;
}
