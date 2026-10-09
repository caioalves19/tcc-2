import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";

import "./globals.css";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Rodape } from "@/components/layout/rodape";
import { sessaoDaRequisicao } from "@/lib/auth";
import { lerCarrinho } from "@/modules/orders";

import { lerTokenDoCarrinho } from "./carrinho/cookie";
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

// Se o banco falhar, o site segue no ar como deslogado em vez de virar 500 inteiro.
async function sessaoDoLayout() {
  const cabecalhos = await headers();
  try {
    return await sessaoDaRequisicao(cabecalhos);
  } catch (erro) {
    unstable_rethrow(erro);
    console.error("Falha ao ler a sessão no layout", erro);
    return null;
  }
}

// RF11: unidades no carrinho para o cabeçalho; falha no banco vira 0, sem derrubar a página.
async function itensNoCarrinhoDoLayout() {
  try {
    const carrinho = await lerCarrinho({
      cabecalhos: await headers(),
      tokenVisitante: await lerTokenDoCarrinho(),
    });
    return carrinho.ok ? carrinho.dados.unidades : 0;
  } catch (erro) {
    unstable_rethrow(erro);
    console.error("Falha ao ler o carrinho no layout", erro);
    return 0;
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [sessao, itensNoCarrinho] = await Promise.all([
    sessaoDoLayout(),
    itensNoCarrinhoDoLayout(),
  ]);

  return (
    <html lang="pt-BR" className={`${fonteCorpo.variable} ${fonteTitulo.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Cabecalho
          logado={sessao !== null}
          administrador={sessao?.papel === "ADMIN"}
          equipe={sessao?.papel === "ADMIN" || sessao?.papel === "ARTISTA"}
          acaoSair={sairAcao}
          itensNoCarrinho={itensNoCarrinho}
        />
        <main className="flex-1">{children}</main>
        <Rodape />
      </body>
    </html>
  );
}
