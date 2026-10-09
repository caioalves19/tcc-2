import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ListaPedidos } from "@/components/conta/lista-pedidos";
import { listarMeusPedidos } from "@/modules/orders";

export const metadata: Metadata = { title: "Meus pedidos · Kolô" };

// RF16: pedidos de quem está logado; visitante vai para o login, como na /conta.
export default async function PaginaPedidos() {
  const pedidos = await listarMeusPedidos({ cabecalhos: await headers() });
  if (pedidos === null) redirect("/login");
  return (
    <section className="mx-auto w-full max-w-4xl px-margem py-12 md:px-margem-desktop md:py-16">
      <ListaPedidos pedidos={pedidos} />
    </section>
  );
}
