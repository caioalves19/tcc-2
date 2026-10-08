import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PedidoCheckout } from "@/components/loja/pedido-checkout";
import { lerPedido } from "@/modules/orders";

export const metadata: Metadata = { title: "Pedido · Kolô" };

// RN01: pedido de outro cliente responde igual a um número que não existe.
export default async function PaginaPedido({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params;
  const pedido = await lerPedido(numero, { cabecalhos: await headers(), tokenVisitante: null });
  if (!pedido) notFound();
  return (
    <section className="mx-auto w-full max-w-pagina px-margem py-12 md:px-margem-desktop md:py-16">
      <PedidoCheckout pedido={pedido} />
    </section>
  );
}
