import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { perfilDaRequisicao } from "@/lib/auth";
import { FormularioPerfil } from "@/components/auth/formulario-perfil";
import { FormularioTrocaSenha } from "@/components/auth/formulario-troca-senha";
import { atualizarPerfilAcao, trocarSenhaAcao } from "./actions";

export const metadata: Metadata = { title: "Minha conta · Kolô" };

export default async function PaginaConta() {
  const perfil = await perfilDaRequisicao(await headers());
  if (perfil === null) redirect("/login");
  return (
    <section className="mx-auto w-full max-w-md px-margem py-16 md:py-24">
      <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
        Minha conta
      </h1>
      <section aria-labelledby="dados-pessoais" className="mt-8">
        <h2 id="dados-pessoais" className="mb-5 font-display text-xl">
          Dados pessoais
        </h2>
        <FormularioPerfil dados={perfil} acao={atualizarPerfilAcao} />
      </section>
      <section aria-labelledby="trocar-senha" className="mt-10">
        <h2 id="trocar-senha" className="mb-5 font-display text-xl">
          Alterar senha
        </h2>
        <FormularioTrocaSenha acao={trocarSenhaAcao} />
      </section>
      <a
        href="/login"
        className="mt-6 inline-block text-[var(--kolo-link)] underline underline-offset-4"
      >
        Entrar novamente
      </a>
    </section>
  );
}
