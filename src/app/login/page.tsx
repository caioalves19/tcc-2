import type { Metadata } from "next";

import { FormularioLogin } from "@/components/auth/formulario-login";

import { entrarAcao } from "./actions";

export const metadata: Metadata = {
  title: "Entrar · Kolô",
};

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { senha } = await searchParams;

  return (
    <section className="mx-auto w-full max-w-md px-margem py-16 md:py-24">
      <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">Entrar</h1>
      <p className="mt-3 text-corpo text-[var(--kolo-texto-suave)]">
        Ainda não tem conta?{" "}
        <a href="/cadastro" className="text-[var(--kolo-link)] underline underline-offset-4">
          Cadastre-se
        </a>
        .
      </p>
      {senha === "alterada" && (
        <p role="status" className="mt-6 rounded-campo border-2 border-[var(--kolo-contorno)] p-4">
          Senha alterada. Entre com a nova senha.
        </p>
      )}
      <div className="mt-8">
        <FormularioLogin acao={entrarAcao} />
      </div>
      <p className="mt-6 text-corpo">
        <a href="/esqueci-senha" className="text-[var(--kolo-link)] underline underline-offset-4">
          Esqueci minha senha
        </a>
      </p>
    </section>
  );
}
