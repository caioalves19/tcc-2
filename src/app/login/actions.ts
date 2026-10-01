"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { entrar, sair } from "@/lib/auth";
import type { EntradaLogin, FalhaLogin } from "@/modules/identity";

// Em produção o Caddy é o único que fala com o app e grava o IP real do cliente
// no X-Forwarded-For; o primeiro item é o cliente.
function ipDaRequisicao(cabecalhos: Headers): string {
  const encaminhado = cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim();
  return encaminhado || cabecalhos.get("x-real-ip") || "desconhecido";
}

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
