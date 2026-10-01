import type { Metadata } from "next";

import { FormularioPedidoRecuperacao } from "@/components/auth/formulario-pedido-recuperacao";

import { pedirRecuperacaoAcao } from "./actions";

export const metadata: Metadata = {
  title: "Esqueci minha senha · Kolô",
};

export default function PaginaEsqueciSenha() {
  return (
    <section className="mx-auto w-full max-w-md px-margem py-16 md:py-24">
      <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
        Esqueci minha senha
      </h1>
      <p className="mt-3 text-corpo text-[var(--kolo-texto-suave)]">
        Informe o e-mail da sua conta. O link para criar uma senha nova vale por 1 hora.
      </p>
      <div className="mt-8">
        <FormularioPedidoRecuperacao acao={pedirRecuperacaoAcao} />
      </div>
    </section>
  );
}
