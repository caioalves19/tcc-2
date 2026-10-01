import type { Metadata } from "next";

import { AvisoLinkInvalido, FormularioRedefinicao } from "@/components/auth/formulario-redefinicao";
import { MENSAGEM_SEM_TOKEN } from "@/modules/identity";

import { redefinirSenhaAcao } from "./actions";

export const metadata: Metadata = {
  title: "Nova senha · Kolô",
  // O token está na URL: não pode vazar no Referer de links desta página.
  referrer: "no-referrer",
};

export default async function PaginaRedefinirSenha({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await searchParams;

  return (
    <section className="mx-auto w-full max-w-md px-margem py-16 md:py-24">
      <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">Nova senha</h1>
      <p className="mt-3 text-corpo text-[var(--kolo-texto-suave)]">
        Ao salvar, você sai de todos os aparelhos e entra de novo com a senha nova.
      </p>
      <div className="mt-8">
        {typeof token === "string" && token !== "" ? (
          <FormularioRedefinicao token={token} acao={redefinirSenhaAcao} />
        ) : (
          <AvisoLinkInvalido mensagem={MENSAGEM_SEM_TOKEN} />
        )}
      </div>
    </section>
  );
}
