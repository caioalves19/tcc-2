import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";

import "./globals.css";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Rodape } from "@/components/layout/rodape";

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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fonteCorpo.variable} ${fonteTitulo.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Cabecalho />
        <main className="flex-1">{children}</main>
        <Rodape />
      </body>
    </html>
  );
}
