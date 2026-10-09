import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { DetalhePedido } from "@/components/conta/detalhe-pedido";
import { sessaoDaRequisicao } from "@/lib/auth";
import { lerMeuPedido } from "@/modules/orders";

export const metadata: Metadata = { title: "Pedido · Kolô" };

// RN01: pedido de outro cliente, oculto ou inexistente responde igual: 404. Visitante vai para o
// login com qualquer número, então o redirecionamento também não revela se o pedido existe.
export default async function PaginaPedido({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params;
  const cabecalhos = await headers();
  const pedido = await lerMeuPedido(numero, { cabecalhos });
  if (!pedido) {
    if (!(await sessaoDaRequisicao(cabecalhos))) redirect("/login");
    notFound();
  }
  return (
    <section className="mx-auto w-full max-w-pagina px-margem py-12 md:px-margem-desktop md:py-16">
      <DetalhePedido pedido={pedido} />
    </section>
  );
}
