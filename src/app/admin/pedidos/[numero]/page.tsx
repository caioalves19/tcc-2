import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PedidoAdminDetalhe } from "@/components/admin/pedido-admin";
import { lerPedidoAdmin } from "@/modules/orders";
import { mudarSituacaoAcao, registrarRastreioAcao } from "../actions";

export const metadata: Metadata = { title: "Pedido · Administração · Kolô" };

export default async function PaginaPedidoAdmin({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero } = await params;
  const resultado = await lerPedidoAdmin(numero, await headers());
  if (!resultado.ok && resultado.erro === "nao_encontrado") notFound();
  if (!resultado.ok) return <p role="alert">{resultado.mensagem}</p>;
  return (
    <PedidoAdminDetalhe
      pedido={resultado.dados}
      acoes={{ mudarSituacao: mudarSituacaoAcao, registrarRastreio: registrarRastreioAcao }}
    />
  );
}
