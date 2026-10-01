"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { entrar, sair } from "@/lib/auth";
import { ipDaRequisicao } from "@/lib/requisicao";
import type { EntradaLogin, FalhaLogin } from "@/modules/identity";

export async function entrarAcao(entrada: EntradaLogin): Promise<FalhaLogin | undefined> {
  const cabecalhos = await headers();
  const resultado = await entrar({ ...entrada, ip: ipDaRequisicao(cabecalhos) });
  if (!resultado.ok) {
    return resultado;
  }
  // TODO(PBI da área do cliente): trocar por /conta quando a rota existir.
  redirect("/");
}

export async function sairAcao(): Promise<void> {
  await sair(await headers());
  redirect("/");
}
