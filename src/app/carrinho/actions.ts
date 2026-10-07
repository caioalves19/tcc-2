"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  adicionarAoCarrinho,
  alterarQuantidade,
  removerDoCarrinho,
  type ResultadoCarrinho,
} from "@/modules/orders";
import { gravarTokenDoCarrinho, lerTokenDoCarrinho } from "./cookie";

async function contexto() {
  return { cabecalhos: await headers(), tokenVisitante: await lerTokenDoCarrinho() };
}

// O layout inteiro, porque a contagem do cabeçalho muda junto com o carrinho.
function revalidar<T extends ResultadoCarrinho<unknown>>(resultado: T): T {
  if (resultado.ok) revalidatePath("/", "layout");
  return resultado;
}

// Pronta para o botão da página da obra (PBI-20). O token do carrinho novo vai só no cookie
// HttpOnly; o navegador nunca o recebe.
export async function adicionarAoCarrinhoAcao(
  obraId: string,
  quantidade = 1,
): Promise<ResultadoCarrinho> {
  const resultado = await adicionarAoCarrinho({ obraId, quantidade }, await contexto());
  if (!resultado.ok) return resultado;
  if (resultado.dados.tokenNovo) await gravarTokenDoCarrinho(resultado.dados.tokenNovo);
  return revalidar({ ok: true, dados: undefined });
}

export async function alterarQuantidadeAcao(obraId: string, quantidade: number) {
  return revalidar(await alterarQuantidade({ obraId, quantidade }, await contexto()));
}

export async function removerDoCarrinhoAcao(obraId: string) {
  return revalidar(await removerDoCarrinho(obraId, await contexto()));
}
