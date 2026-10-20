import type { Metadata } from "next";
import { headers } from "next/headers";
import { PainelAdmin } from "@/components/admin/painel-admin";
import { lerPainel } from "@/modules/reports";

export const metadata: Metadata = { title: "Painel · Administração · Kolô" };

// RF32 (PBI-48): a página inicial do admin é o painel de indicadores, calculado no servidor.
export default async function PaginaAdmin() {
  const resultado = await lerPainel(await headers());
  if (!resultado.ok) return <p role="alert">{resultado.mensagem}</p>;
  return <PainelAdmin painel={resultado.dados} />;
}
