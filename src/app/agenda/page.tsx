import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AgendaSemana } from "@/components/agenda/agenda-semana";
import { lerAgenda } from "@/modules/scheduling";
import { cadastrarHorarioAcao, editarHorarioAcao, mudarSituacaoHorarioAcao } from "./actions";

export const metadata: Metadata = { title: "Agenda · Kolô" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Parâmetro repetido na URL: vale o primeiro.
function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

// RF22/RN10: agenda só da equipe. O artista vê a própria; o admin, todas (com filtro).
export default async function PaginaAgenda({ searchParams }: Props) {
  const { semana, artista } = await searchParams;
  const agenda = await lerAgenda(await headers(), {
    semana: primeiro(semana),
    artista: primeiro(artista),
  });
  if (!agenda.ok && agenda.erro === "nao_autenticado") redirect("/login");
  return (
    <section className="mx-auto w-full max-w-pagina px-margem py-12 md:px-margem-desktop md:py-16">
      {agenda.ok ? (
        <AgendaSemana
          {...agenda.dados}
          cadastrar={cadastrarHorarioAcao}
          editar={editarHorarioAcao}
          mudarSituacao={mudarSituacaoHorarioAcao}
        />
      ) : (
        <div className="grid max-w-md gap-4">
          <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">Agenda</h1>
          <p role="alert">{agenda.mensagem}</p>
          <a href="/" className="underline underline-offset-4">
            Voltar ao início
          </a>
        </div>
      )}
    </section>
  );
}
