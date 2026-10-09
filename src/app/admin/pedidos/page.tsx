import type { Metadata } from "next";
import { headers } from "next/headers";
import { ListaPedidosAdmin } from "@/components/admin/lista-pedidos-admin";
import { listarPedidosAdmin } from "@/modules/orders";

export const metadata: Metadata = { title: "Pedidos · Administração · Kolô" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Parâmetro repetido na URL (?busca=a&busca=b): vale o primeiro.
function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

// RF29: o módulo valida filtro, busca e página; qualquer valor fora do esperado volta ao padrão.
export default async function PaginaPedidosAdmin({ searchParams }: Props) {
  const { filtro, busca, pagina } = await searchParams;
  const resultado = await listarPedidosAdmin(
    { filtro: primeiro(filtro), busca: primeiro(busca), pagina: primeiro(pagina) },
    await headers(),
  );
  if (!resultado.ok) return <p role="alert">{resultado.mensagem}</p>;
  return <ListaPedidosAdmin {...resultado.dados} />;
}
