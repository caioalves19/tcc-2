import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ListaPedidos } from "@/components/conta/lista-pedidos";
import { urlDeLogin } from "@/modules/identity";
import { listarMeusPedidosPaginados } from "@/modules/orders";

export const metadata: Metadata = { title: "Meus pedidos · Kolô" };

// RF16: pedidos de quem está logado; visitante vai para o login, como na /conta.
export default async function PaginaPedidos({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { pagina } = await searchParams;
  const lista = await listarMeusPedidosPaginados(
    { cabecalhos: await headers() },
    { pagina: Array.isArray(pagina) ? pagina[0] : pagina },
  );
  if (lista === null) redirect(urlDeLogin("/conta/pedidos"));
  return (
    <section className="mx-auto w-full max-w-4xl px-margem py-12 md:px-margem-desktop md:py-16">
      <ListaPedidos {...lista} />
    </section>
  );
}
