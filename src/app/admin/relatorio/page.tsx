import type { Metadata } from "next";
import { headers } from "next/headers";
import { RelatorioVendas } from "@/components/admin/relatorio-vendas";
import { lerRelatorioVendas } from "@/modules/reports";

export const metadata: Metadata = { title: "Relatório de vendas · Administração · Kolô" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Parâmetro repetido na URL (?periodo=a&periodo=b): vale o primeiro.
function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

// RF32 (PBI-48): o módulo valida o período; fora do esperado, volta ao mês corrente.
export default async function PaginaRelatorio({ searchParams }: Props) {
  const { periodo, de, ate } = await searchParams;
  const resultado = await lerRelatorioVendas(
    { periodo: primeiro(periodo), de: primeiro(de), ate: primeiro(ate) },
    await headers(),
  );
  if (!resultado.ok) return <p role="alert">{resultado.mensagem}</p>;
  return <RelatorioVendas relatorio={resultado.dados} />;
}
