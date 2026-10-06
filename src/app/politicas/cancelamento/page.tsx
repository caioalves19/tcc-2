import type { Metadata } from "next";

import { DocumentoPolitica } from "@/components/politicas/documento-politica";

import { CANCELAMENTO } from "./conteudo";

export const metadata: Metadata = {
  title: "Política de cancelamento · Kolô",
  description: CANCELAMENTO.resumo,
};

export default function PaginaCancelamento() {
  return <DocumentoPolitica politica={CANCELAMENTO} />;
}
