import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { verificarAcessoAdmin } from "@/modules/artists";

export default async function LayoutAdmin({ children }: { children: ReactNode }) {
  const acesso = await verificarAcessoAdmin(await headers());
  if (!acesso.ok && acesso.erro === "nao_autenticado") redirect("/login");
  if (!acesso.ok)
    return (
      <section className="mx-auto max-w-pagina px-margem py-12">
        <h1 className="font-display text-2xl">Área administrativa</h1>
        <p role="alert" className="mt-4">
          {acesso.mensagem}
        </p>
        <a href="/" className="mt-4 inline-block underline">
          Voltar ao início
        </a>
      </section>
    );
  return (
    <section className="mx-auto max-w-pagina px-margem py-12 md:px-margem-desktop">
      <nav aria-label="Administração" className="mb-8 flex flex-wrap gap-4">
        <a href="/admin" className="underline">
          Administração
        </a>
        <a href="/admin/artistas" className="underline">
          Artistas
        </a>
        <a href="/admin/estilos" className="underline">
          Estilos
        </a>
        <a href="/admin/tags" className="underline">
          Tags
        </a>
      </nav>
      {children}
    </section>
  );
}
