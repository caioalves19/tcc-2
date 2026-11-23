"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { atualizarPerfil, sair, trocarSenha, usuarioIdDaRequisicao } from "@/lib/auth";
import { salvarEndereco } from "@/lib/endereco";
import { excluirPropriaConta, type ResultadoExclusao } from "@/modules/customers";
import {
  buscarEnderecoPorCep,
  type EnderecoDoCep,
  type EntradaEndereco,
  type ResultadoEndereco,
} from "@/modules/endereco";
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

export async function salvarEnderecoAcao(entrada: EntradaEndereco): Promise<ResultadoEndereco> {
  const resultado = await salvarEndereco(entrada, await headers());
  if (resultado.ok) revalidatePath("/conta");
  return resultado;
}

// RF05: preenche o endereço pelo CEP. Só com sessão, para o site não servir de intermediário
// aberto de consultas ao ViaCEP; a entrada vem do navegador, então não se confia no tipo.
export async function buscarCepAcao(cep: unknown): Promise<EnderecoDoCep | null> {
  if (typeof cep !== "string") return null;
  if ((await usuarioIdDaRequisicao(await headers())) === null) return null;
  return buscarEnderecoPorCep(cep);
}

// RN12 (PBI-40): as sessões já saíram do banco; o sair só apaga o cookie deste navegador.
export async function excluirContaAcao(entrada: unknown): Promise<ResultadoExclusao> {
  const cabecalhos = await headers();
  const resultado = await excluirPropriaConta(entrada, cabecalhos);
  if (!resultado.ok) return resultado;
  await sair(cabecalhos);
  redirect("/");
}
