import type { Metadata } from "next";

import { DocumentoPolitica } from "@/components/politicas/documento-politica";

import { TERMOS } from "./conteudo";

export const metadata: Metadata = {
  title: "Termos de uso · Kolô",
  description: TERMOS.resumo,
};

export default function PaginaTermos() {
  return <DocumentoPolitica politica={TERMOS} />;
}
