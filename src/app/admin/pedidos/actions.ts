"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { mudarSituacaoPedido, registrarRastreio } from "@/modules/orders";
import { cancelarPedido, estornarPagamento, gatewayMercadoPago } from "@/modules/payments";
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
// PBI-43: o módulo confere sessão, papel e situação e chama o Mercado Pago com o token do ambiente.
export async function cancelarPedidoAcao(entrada: { numero: string }) {
  return revalidar(
    await cancelarPedido(entrada, await headers(), { gateway: gatewayMercadoPago() }),
  );
}
export async function estornarPagamentoAcao(entrada: { numero: string; idExterno: string }) {
  return revalidar(
    await estornarPagamento(entrada, await headers(), { gateway: gatewayMercadoPago() }),
  );
}
