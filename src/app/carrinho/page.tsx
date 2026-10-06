import type { Metadata } from "next";
import { headers } from "next/headers";
import { CarrinhoCompras } from "@/components/loja/carrinho-compras";
import { lerCarrinho } from "@/modules/orders";
import { alterarQuantidadeAcao, removerDoCarrinhoAcao } from "./actions";
import { lerTokenDoCarrinho } from "./cookie";

export const metadata: Metadata = { title: "Carrinho · Kolô" };

export default async function PaginaCarrinho() {
  const carrinho = await lerCarrinho({
    cabecalhos: await headers(),
    tokenVisitante: await lerTokenDoCarrinho(),
  });
  return (
    <section className="mx-auto w-full max-w-pagina px-margem py-12 md:px-margem-desktop md:py-16">
      {carrinho.ok ? (
        <CarrinhoCompras
          {...carrinho.dados}
          baseImagens={process.env.R2_PUBLIC_URL?.trim() || null}
          alterar={alterarQuantidadeAcao}
          remover={removerDoCarrinhoAcao}
        />
      ) : (
        <>
          <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
            Seu carrinho
          </h1>
          <p role="alert" className="mt-4">
            {carrinho.mensagem}
          </p>
        </>
      )}
    </section>
  );
}
