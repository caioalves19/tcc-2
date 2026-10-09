import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { perfilDaRequisicao } from "@/lib/auth";
import { enderecoDaRequisicao } from "@/lib/endereco";
import { ENDERECO_VAZIO } from "@/modules/endereco";
import { FormularioEndereco } from "@/components/auth/formulario-endereco";
import { FormularioPerfil } from "@/components/auth/formulario-perfil";
import { FormularioTrocaSenha } from "@/components/auth/formulario-troca-senha";
import { buttonVariants } from "@/components/ui/button";
import { atualizarPerfilAcao, salvarEnderecoAcao, trocarSenhaAcao } from "./actions";

export const metadata: Metadata = { title: "Minha conta · Kolô" };

export default async function PaginaConta() {
  const cabecalhos = await headers();
  const perfil = await perfilDaRequisicao(cabecalhos);
  if (perfil === null) redirect("/login");
  const endereco = await enderecoDaRequisicao(cabecalhos);
  return (
    <section className="mx-auto w-full max-w-md px-margem py-16 md:py-24">
      <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
        Minha conta
      </h1>
      <a
        href="/conta/pedidos"
        className={buttonVariants({ variant: "contorno", className: "mt-6" })}
      >
        Meus pedidos
      </a>
      <section aria-labelledby="dados-pessoais" className="mt-8">
        <h2 id="dados-pessoais" className="mb-5 font-display text-xl">
          Dados pessoais
        </h2>
        <FormularioPerfil dados={perfil} acao={atualizarPerfilAcao} />
      </section>
      <section aria-labelledby="endereco-entrega" className="mt-10">
        <h2 id="endereco-entrega" className="mb-5 font-display text-xl">
          Endereço de entrega
        </h2>
        <FormularioEndereco dados={endereco ?? ENDERECO_VAZIO} acao={salvarEnderecoAcao} />
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
