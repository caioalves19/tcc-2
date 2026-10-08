import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { CheckoutCompra } from "@/components/loja/checkout-compra";
import { resumoCheckout } from "@/modules/orders";
import { lerTokenDoCarrinho } from "../carrinho/cookie";
import { finalizarCompraAcao } from "./actions";

export const metadata: Metadata = { title: "Finalizar compra · Kolô" };

// RF12/RN01: o checkout exige conta; o resumo inteiro é calculado no servidor.
export default async function PaginaCheckout() {
  const resumo = await resumoCheckout({
    cabecalhos: await headers(),
    tokenVisitante: await lerTokenDoCarrinho(),
  });
  if (!resumo.ok && resumo.erro === "nao_autenticado") redirect("/login");
  if (!resumo.ok && resumo.erro === "carrinho_vazio") redirect("/carrinho");
  return (
    <section className="mx-auto w-full max-w-pagina px-margem py-12 md:px-margem-desktop md:py-16">
      {resumo.ok ? (
        <CheckoutCompra
          {...resumo.dados}
          baseImagens={process.env.R2_PUBLIC_URL?.trim() || null}
          finalizar={finalizarCompraAcao}
        />
      ) : (
        <div className="grid max-w-md gap-4">
          <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
            Finalizar compra
          </h1>
          <p role="alert">{resumo.mensagem}</p>
          {resumo.erro === "sem_endereco" ? (
            <a href="/conta" className={buttonVariants()}>
              Cadastrar endereço
            </a>
          ) : (
            <a href="/carrinho" className={buttonVariants({ variant: "contorno" })}>
              Voltar ao carrinho
            </a>
          )}
        </div>
      )}
    </section>
  );
}
