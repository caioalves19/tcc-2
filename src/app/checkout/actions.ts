"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { finalizarCompra } from "@/modules/orders";
import { lerTokenDoCarrinho } from "../carrinho/cookie";

type RecusaCheckout =
  | { ok: false; erro: string; mensagem: string }
  | { ok: false; erro: "indisponivel"; obras: string[]; mensagem: string };

// RF12: a entrada vai adiante como veio; quem valida e descarta o que sobra é o módulo.
export async function finalizarCompraAcao(entrada: unknown): Promise<RecusaCheckout> {
  const resultado = await finalizarCompra(entrada, {
    cabecalhos: await headers(),
    tokenVisitante: await lerTokenDoCarrinho(),
  });
  if (resultado.ok) redirect(`/checkout/${resultado.dados.numero}`);
  // RN06: com Pix ou boleto em aberto, o cliente volta ao pedido que já existe.
  if (resultado.erro === "pendente") redirect(`/checkout/${resultado.numero}`);
  if (resultado.erro === "nao_autenticado") redirect("/login");
  return resultado;
}
