"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Paginacao } from "@/components/ui/paginacao";
import { classeCampo, useGestao, usePainelAberto } from "@/components/admin/formulario";
import type { PortfolioGestao, ResultadoPortfolio } from "@/modules/portfolio";
import { FormularioTrabalho, type AcoesFormulario } from "./formulario-trabalho";

type Props = PortfolioGestao &
  AcoesFormulario & {
    mover: (entrada: unknown) => Promise<ResultadoPortfolio<unknown>>;
    remover: (id: string) => Promise<ResultadoPortfolio<unknown>>;
  };

export function GestaoPortfolio({
  papel,
  artistas,
  artistaId,
  estilos,
  trabalhos,
  total,
  pagina,
  totalPaginas,
  mover,
  remover,
  ...acoes
}: Props) {
  // A ordem é a do artista inteiro: as bordas da página não travam a troca com o vizinho.
  const primeiroGeral = (indice: number) => pagina === 1 && indice === 0;
  const ultimoGeral = (indice: number) =>
    pagina === totalPaginas && indice === trabalhos.length - 1;
  const parametros = { artista: papel === "ADMIN" ? (artistaId ?? undefined) : undefined };
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const editando = trabalhos.find((t) => t.id === editandoId);
  const [novo, setNovo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const painel = usePainelAberto(editando?.id ?? (novo ? "novo" : null));
  const fecharPainel = () => {
    setNovo(false);
    setEditandoId(null);
  };
  const gestao = useGestao();
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
        Gestão do portfólio
      </h1>
      {papel === "ADMIN" && (
        <form action="/portfolio/gestao" method="get" className="flex flex-wrap items-end gap-3">
          <div className="grid w-full max-w-sm gap-2">
            <label htmlFor="filtro-artista">Artista</label>
            <select
              id="filtro-artista"
              name="artista"
              defaultValue={artistaId ?? ""}
              required
              className={classeCampo}
            >
              <option value="">Selecione o artista</option>
              {artistas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="contorno">
            Abrir portfólio
          </Button>
        </form>
      )}
      {!artistaId && <p>Selecione um artista para gerenciar o portfólio.</p>}
      {artistaId && !novo && !editando && (
        <div>
          <Button
            type="button"
            onClick={() => {
              setNovo(true);
              setAviso(null);
              gestao.limpar();
            }}
          >
            Novo trabalho
          </Button>
        </div>
      )}
      {artistaId && (novo || editando) && (
        <div ref={painel} className="max-w-2xl scroll-mt-24">
          <FormularioTrabalho
            key={`${artistaId}/${editando?.id ?? "novo"}`}
            artistaId={artistaId}
            estilos={estilos}
            trabalho={editando}
            {...acoes}
            aoCancelar={fecharPainel}
            aoSalvar={(mensagem) => {
              fecharPainel();
              setAviso(mensagem);
            }}
          />
        </div>
      )}
      <section aria-labelledby="trabalhos-titulo" className="min-w-0">
        <h2 id="trabalhos-titulo" className="mb-4 font-display text-xl">
          Trabalhos cadastrados
        </h2>
        {aviso && (
          <p role="status" className="mb-4 text-corpo">
            {aviso}
          </p>
        )}
        {gestao.feedback}
        {total === 0 && <p>Nenhum trabalho cadastrado.</p>}
        {total > 0 && trabalhos.length === 0 && (
          <a
            href={
              parametros.artista
                ? `/portfolio/gestao?artista=${parametros.artista}`
                : "/portfolio/gestao"
            }
            className="underline underline-offset-4"
          >
            Ir para a primeira página
          </a>
        )}
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {trabalhos.map((t, indice) => (
            <li
              key={t.id}
              className="flex min-w-0 flex-col gap-3 rounded-campo border-2 border-[var(--kolo-contorno)] p-3"
            >
              <Image
                src={t.miniaturaUrl}
                alt={t.titulo}
                width={320}
                height={320}
                sizes="(min-width: 1024px) 22vw, 45vw"
                className="aspect-square w-full rounded-campo object-cover"
              />
              <div className="min-w-0 flex-1">
                <h3 className="break-words font-semibold">{t.titulo}</h3>
                <p className="break-words text-nota">
                  {[
                    t.destaque ? "Em destaque" : null,
                    t.regiaoCorpo,
                    ...estilos.filter((e) => t.estilos.includes(e.id)).map((e) => e.nome),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="contorno"
                  disabled={gestao.pendente}
                  aria-label={`Editar ${t.titulo}`}
                  onClick={() => {
                    setNovo(false);
                    setEditandoId(t.id);
                    setAviso(null);
                    gestao.limpar();
                  }}
                >
                  Editar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="contorno"
                  disabled={gestao.pendente || primeiroGeral(indice)}
                  aria-label={`Subir ${t.titulo}`}
                  onClick={() =>
                    void gestao.executar(
                      () => mover({ id: t.id, direcao: "antes" }),
                      () => undefined,
                      "Ordem atualizada.",
                    )
                  }
                >
                  Subir
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="contorno"
                  disabled={gestao.pendente || ultimoGeral(indice)}
                  aria-label={`Descer ${t.titulo}`}
                  onClick={() =>
                    void gestao.executar(
                      () => mover({ id: t.id, direcao: "depois" }),
                      () => undefined,
                      "Ordem atualizada.",
                    )
                  }
                >
                  Descer
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="contorno"
                  disabled={gestao.pendente}
                  aria-label={`Remover ${t.titulo}`}
                  onClick={() => {
                    if (window.confirm(`Remover o trabalho “${t.titulo}” do portfólio?`))
                      void gestao.executar(
                        () => remover(t.id),
                        () => {
                          if (editandoId === t.id) setEditandoId(null);
                        },
                        "Trabalho removido.",
                      );
                  }}
                >
                  Remover
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <Paginacao
          caminho="/portfolio/gestao"
          parametros={parametros}
          pagina={pagina}
          totalPaginas={totalPaginas}
        />
      </section>
    </div>
  );
}
