import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { headers } from "next/headers";

import "./globals.css";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Rodape } from "@/components/layout/rodape";
import { sessaoDaRequisicao } from "@/lib/auth";

import { sairAcao } from "./login/actions";

const fonteCorpo = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--fonte-corpo",
});

const fonteTitulo = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--fonte-titulo",
});

export const metadata: Metadata = {
  title: "Kolô Ateliê & Estúdio",
  description:
    "Arte urbana autêntica, feita por pessoas reais: obras originais, murais e estúdio de tatuagem em São Paulo.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const sessao = await sessaoDaRequisicao(await headers());

  return (
    <html lang="pt-BR" className={`${fonteCorpo.variable} ${fonteTitulo.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Cabecalho logado={sessao !== null} acaoSair={sairAcao} />
        <main className="flex-1">{children}</main>
        <Rodape />
      </body>
    </html>
  );
}
