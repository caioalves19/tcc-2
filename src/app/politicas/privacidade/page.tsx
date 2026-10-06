import type { Metadata } from "next";

import { DocumentoPolitica } from "@/components/politicas/documento-politica";

import { PRIVACIDADE } from "./conteudo";

export const metadata: Metadata = {
  title: "Política de privacidade · Kolô",
  description: PRIVACIDADE.resumo,
};

export default function PaginaPrivacidade() {
  return <DocumentoPolitica politica={PRIVACIDADE} />;
}
