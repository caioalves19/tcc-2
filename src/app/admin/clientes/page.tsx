import type { Metadata } from "next";
import { headers } from "next/headers";
import { ListaClientesAdmin } from "@/components/admin/lista-clientes-admin";
import { listarClientesAdmin } from "@/modules/customers";

export const metadata: Metadata = { title: "Clientes · Administração · Kolô" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Parâmetro repetido na URL (?busca=a&busca=b): vale o primeiro.
function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

// RF30: o módulo valida busca e página; qualquer valor fora do esperado volta ao padrão.
export default async function PaginaClientesAdmin({ searchParams }: Props) {
  const { busca, pagina } = await searchParams;
  const resultado = await listarClientesAdmin(
    { busca: primeiro(busca), pagina: primeiro(pagina) },
    await headers(),
  );
  if (!resultado.ok) return <p role="alert">{resultado.mensagem}</p>;
  return <ListaClientesAdmin {...resultado.dados} />;
}
