import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PerfilClienteAdmin } from "@/components/admin/perfil-cliente-admin";
import { lerClienteAdmin } from "@/modules/customers";

export const metadata: Metadata = { title: "Cliente · Administração · Kolô" };

// RF30: o módulo valida o id; fora do formato, inexistente ou de quem não é cliente dá 404.
export default async function PaginaClienteAdmin({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const { pagina } = await searchParams;
  const resultado = await lerClienteAdmin(
    id,
    await headers(),
    undefined,
    Array.isArray(pagina) ? pagina[0] : pagina,
  );
  if (!resultado.ok && resultado.erro === "nao_encontrado") notFound();
  if (!resultado.ok) return <p role="alert">{resultado.mensagem}</p>;
  return <PerfilClienteAdmin cliente={resultado.dados} />;
}
