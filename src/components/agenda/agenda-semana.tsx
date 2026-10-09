"use client";

import { useState } from "react";
import { unstable_rethrow, useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormularioHorario } from "@/components/agenda/formulario-horario";
import type { AgendaDaSemana, HorarioAgenda } from "@/modules/scheduling";

type Resultado =
  { ok: true } | { ok: false; erro: string; mensagem: string; campos?: Record<string, string> };
type Props = AgendaDaSemana & {
  // Server Actions (src/app/agenda/actions.ts).
  cadastrar: (entrada: Record<string, string>) => Promise<Resultado>;
  editar: (entrada: Record<string, string>) => Promise<Resultado>;
  mudarSituacao: (entrada: {
    id: string;
    situacao: "CANCELADO" | "CONCLUIDO";
  }) => Promise<Resultado>;
};

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const SITUACAO = { AGENDADO: "Agendado", CANCELADO: "Cancelado", CONCLUIDO: "Concluído" };

const diaMes = (data: string) => `${data.slice(8, 10)}/${data.slice(5, 7)}`;
const hora = (horario: string) => horario.slice(11, 16);

// A semana e o filtro de artista ficam na URL; "Esta semana" volta para a semana atual.
function hrefAgenda(semana: string | null, artista: string | null): string {
  const parametros = new URLSearchParams();
  if (semana) parametros.set("semana", semana);
  if (artista) parametros.set("artista", artista);
  const texto = parametros.toString();
  return texto ? `/agenda?${texto}` : "/agenda";
}

type Formulario = { modo: "novo" } | { modo: "editar"; horario: HorarioAgenda } | null;

// RF22/RN09/RN10: agenda da semana (segunda a domingo, horário de São Paulo). O artista vê e
// opera só a própria; o admin filtra por artista. Tudo chega pronto do servidor.
export function AgendaSemana({
  papel,
  artistaId,
  artistas,
  semana,
  dias,
  opcoes,
  cadastrar,
  editar,
  mudarSituacao,
}: Props) {
  const router = useRouter();
  const [formulario, setFormulario] = useState<Formulario>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);
  const admin = papel === "ADMIN";

  async function situacao(id: string, nova: "CANCELADO" | "CONCLUIDO") {
    setPendente(true);
    setMensagem(null);
    try {
      const resultado = await mudarSituacao({ id, situacao: nova });
      if (resultado.ok) router.refresh();
      else setMensagem(resultado.mensagem);
    } catch (falha) {
      unstable_rethrow(falha);
      setMensagem("Não foi possível atualizar agora. Tente novamente.");
    } finally {
      setPendente(false);
    }
  }

  function salvo() {
    setFormulario(null);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">Agenda</h1>
          <p className="text-nota">
            Semana de {diaMes(semana.inicio)} a {diaMes(semana.fim)}/{semana.fim.slice(0, 4)}
          </p>
        </div>
        {admin && (
          <div className="grid gap-1">
            <label htmlFor="agenda-artista" className="text-nota font-semibold">
              Artista
            </label>
            <select
              id="agenda-artista"
              defaultValue={artistaId ?? ""}
              onChange={(evento) =>
                router.push(hrefAgenda(semana.inicio, evento.target.value || null))
              }
              className="h-12 rounded-campo border-2 border-[var(--kolo-contorno)] bg-transparent px-3"
            >
              <option value="">Todos os artistas</option>
              {artistas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <nav aria-label="Semanas" className="mt-6 flex flex-wrap gap-2">
        <a
          href={hrefAgenda(semana.anterior, artistaId && admin ? artistaId : null)}
          className={buttonVariants({ variant: "contorno", size: "sm" })}
        >
          Semana anterior
        </a>
        <a
          href={hrefAgenda(null, artistaId && admin ? artistaId : null)}
          className={buttonVariants({ variant: "contorno", size: "sm" })}
        >
          Esta semana
        </a>
        <a
          href={hrefAgenda(semana.proxima, artistaId && admin ? artistaId : null)}
          className={buttonVariants({ variant: "contorno", size: "sm" })}
        >
          Próxima semana
        </a>
      </nav>

      <div className="mt-6 grid gap-4">
        {formulario === null ? (
          <div>
            <Button type="button" onClick={() => setFormulario({ modo: "novo" })}>
              Novo horário
            </Button>
          </div>
        ) : (
          <FormularioHorario
            key={formulario.modo === "editar" ? formulario.horario.id : "novo"}
            artistas={admin ? artistas : []}
            opcoes={opcoes}
            inicial={formulario.modo === "editar" ? formulario.horario : undefined}
            enviar={formulario.modo === "editar" ? editar : cadastrar}
            aoSalvar={salvo}
            aoCancelar={() => setFormulario(null)}
          />
        )}
        {mensagem && (
          <p role="alert" className="text-destructive">
            {mensagem}
          </p>
        )}
      </div>

      <div className="mt-8 grid gap-6">
        {dias.map((dia, i) => {
          const titulo = `${DIAS[i]}, ${diaMes(dia.data)}`;
          const idTitulo = `dia-${dia.data}`;
          return (
            <section key={dia.data} aria-labelledby={idTitulo} className="grid gap-3">
              <h2 id={idTitulo} className="font-display text-titulo-lg uppercase">
                {titulo}
              </h2>
              {dia.horarios.length === 0 ? (
                <p className="text-nota">Sem horários</p>
              ) : (
                <ul className="grid gap-3">
                  {dia.horarios.map((h) => (
                    <li
                      key={h.id}
                      className="grid gap-2 rounded-card border-2 border-neutro-grafite bg-[var(--kolo-superficie)] p-4 text-[var(--kolo-superficie-texto)]"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-display text-titulo-lg">
                          {hora(h.inicio)}–{hora(h.fim)}
                        </span>
                        <span className="rounded-campo border-2 border-neutro-grafite px-2 py-0.5 font-display text-etiqueta uppercase">
                          {SITUACAO[h.situacao]}
                        </span>
                        {admin && <span className="font-semibold">{h.artistaNome}</span>}
                        <span className="text-nota">{h.codigo}</span>
                      </div>
                      <p>
                        <strong>{h.nomeContato}</strong> ·{" "}
                        <a
                          href={`tel:+55${h.telefoneContato}`}
                          className="text-[var(--kolo-link)] underline underline-offset-4"
                        >
                          {h.telefoneContato}
                        </a>
                        {h.emailCliente && ` · ${h.emailCliente}`}
                      </p>
                      {(h.estiloNome || h.tamanhoNome || h.regiaoCorpo) && (
                        <p className="text-nota">
                          {[h.estiloNome, h.tamanhoNome, h.regiaoCorpo].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      {h.observacoes && <p className="whitespace-pre-line">{h.observacoes}</p>}
                      {h.situacao === "AGENDADO" && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="contorno"
                            size="sm"
                            aria-label={`Editar o horário de ${h.nomeContato}`}
                            onClick={() => setFormulario({ modo: "editar", horario: h })}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="contorno"
                            size="sm"
                            disabled={pendente}
                            aria-label={`Concluir o horário de ${h.nomeContato}`}
                            onClick={() => void situacao(h.id, "CONCLUIDO")}
                          >
                            Concluir
                          </Button>
                          <Button
                            type="button"
                            variant="contorno"
                            size="sm"
                            disabled={pendente}
                            aria-label={`Cancelar o horário de ${h.nomeContato}`}
                            onClick={() => void situacao(h.id, "CANCELADO")}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
