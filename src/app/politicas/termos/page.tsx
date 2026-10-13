import type { Metadata } from "next";

import { DocumentoPolitica } from "@/components/politicas/documento-politica";
import { lerConfiguracao, PADRAO } from "@/modules/settings";

import { termos } from "./conteudo";

export const metadata: Metadata = {
  title: "Termos de uso · Kolô",
  description: termos(PADRAO.contato).resumo,
};

export default async function PaginaTermos() {
  const { contato } = await lerConfiguracao();
  return <DocumentoPolitica politica={termos(contato)} contato={contato} />;
}
