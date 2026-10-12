import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GestaoPortfolio } from "@/components/portfolio/gestao-portfolio";
import { lerPortfolio } from "@/modules/portfolio";
import { solicitarUploadAcao, processarImagemAcao } from "@/app/imagens/actions";
import {
  criarTrabalhoAcao,
  editarTrabalhoAcao,
  moverTrabalhoAcao,
  removerTrabalhoAcao,
} from "./actions";

export const metadata: Metadata = { title: "Gestão do portfólio · Kolô" };
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PaginaPortfolio({ searchParams }: Props) {
  const { artista } = await searchParams;
  const resultado = await lerPortfolio(
    await headers(),
    Array.isArray(artista) ? artista[0] : artista,
  );
  if (!resultado.ok && resultado.erro === "nao_autenticado") redirect("/login");
  return (
    <section className="mx-auto w-full max-w-pagina px-margem py-12 md:px-margem-desktop md:py-16">
      {resultado.ok ? (
        <GestaoPortfolio
          key={resultado.dados.artistaId ?? "selecao"}
          {...resultado.dados}
          criar={criarTrabalhoAcao}
          editar={editarTrabalhoAcao}
          mover={moverTrabalhoAcao}
          remover={removerTrabalhoAcao}
          solicitar={solicitarUploadAcao}
          processar={processarImagemAcao}
        />
      ) : (
        <div className="grid max-w-md gap-4">
          <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
            Gestão do portfólio
          </h1>
          <p role="alert">{resultado.mensagem}</p>
          <a href="/" className="underline underline-offset-4">
            Voltar ao início
          </a>
        </div>
      )}
    </section>
  );
}
