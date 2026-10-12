"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { gatewayMercadoPago, iniciarPagamento, type ResultadoPagamento } from "@/modules/payments";

type RecusaPagamento = Extract<ResultadoPagamento, { ok: false }>;

// RF13: o cliente sai daqui para o checkout hospedado; nenhum dado de cartão passa pelo Kolô
// (RNF10). Quem valida o pedido é o módulo.
export async function pagarPedidoAcao(numero: unknown): Promise<RecusaPagamento> {
  const resultado = await iniciarPagamento(
    numero,
    { cabecalhos: await headers(), tokenVisitante: null },
    { gateway: gatewayMercadoPago() },
  );
  if (resultado.ok) redirect(resultado.dados.url);
  return resultado;
}
