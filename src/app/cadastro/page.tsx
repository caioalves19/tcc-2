import type { Metadata } from "next";

import { FormularioCadastro } from "@/components/auth/formulario-cadastro";

import { cadastrar } from "./actions";

export const metadata: Metadata = {
  title: "Criar conta · Kolô",
};

export default function PaginaCadastro() {
  return (
    <section className="mx-auto w-full max-w-md px-margem py-16 md:py-24">
      <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
        Criar conta
      </h1>
      <p className="mt-3 text-corpo text-[var(--kolo-texto-suave)]">
        Cadastre-se para comprar obras e acompanhar seus pedidos.
      </p>
      <div className="mt-8">
        <FormularioCadastro acao={cadastrar} />
      </div>
    </section>
  );
}
