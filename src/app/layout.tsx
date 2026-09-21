import type { ReactNode } from "react";

import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";

import "./globals.css";

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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fonteCorpo.variable} ${fonteTitulo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
