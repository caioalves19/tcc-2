import type { Metadata } from "next";

import { DocumentoPolitica } from "@/components/politicas/documento-politica";
import { lerConfiguracao, PADRAO } from "@/modules/settings";

import { privacidade } from "./conteudo";

export const metadata: Metadata = {
  title: "Política de privacidade · Kolô",
  description: privacidade(PADRAO.contato).resumo,
};

export default async function PaginaPrivacidade() {
  const { contato } = await lerConfiguracao();
  return <DocumentoPolitica politica={privacidade(contato)} contato={contato} />;
}
