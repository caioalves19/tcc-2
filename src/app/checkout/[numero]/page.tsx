import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PedidoCheckout } from "@/components/loja/pedido-checkout";
import { lerPedido } from "@/modules/orders";
import { pagarPedidoAcao } from "./actions";

export const metadata: Metadata = { title: "Pedido · Kolô" };

// RN01: pedido de outro cliente responde igual a um número que não existe.
// RN05: os parâmetros que o Mercado Pago acrescenta na volta não mudam a situação do pedido.
export default async function PaginaPedido({
  params,
  searchParams,
}: {
  params: Promise<{ numero: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { numero } = await params;
  const { retorno } = await searchParams;
  const pedido = await lerPedido(numero, { cabecalhos: await headers(), tokenVisitante: null });
  if (!pedido) notFound();
  return (
    <section className="mx-auto w-full max-w-pagina px-margem py-12 md:px-margem-desktop md:py-16">
      <PedidoCheckout
        pedido={pedido}
        pagar={pagarPedidoAcao}
        voltouDoPagamento={retorno === "mercadopago"}
      />
    </section>
  );
}
