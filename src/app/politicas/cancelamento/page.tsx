import type { Metadata } from "next";

import { DocumentoPolitica } from "@/components/politicas/documento-politica";
import { lerConfiguracao, PADRAO } from "@/modules/settings";

import { cancelamento } from "./conteudo";

export const metadata: Metadata = {
  title: "Política de cancelamento · Kolô",
  description: cancelamento(PADRAO.contato).resumo,
};

export default async function PaginaCancelamento() {
  const { contato } = await lerConfiguracao();
  return <DocumentoPolitica politica={cancelamento(contato)} contato={contato} />;
}
