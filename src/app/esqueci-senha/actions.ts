"use server";

import { headers } from "next/headers";

import { solicitarRecuperacao } from "@/lib/auth";
import { ipDaRequisicao } from "@/lib/requisicao";
import type { EntradaPedidoRecuperacao, ResultadoPedidoRecuperacao } from "@/modules/identity";

export async function pedirRecuperacaoAcao(
  entrada: EntradaPedidoRecuperacao,
): Promise<ResultadoPedidoRecuperacao> {
  return solicitarRecuperacao({ ...entrada, ip: ipDaRequisicao(await headers()) });
}
