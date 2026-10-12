"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { classeCampo, useGestao } from "@/components/admin/formulario";
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
  mover,
  remover,
  ...acoes
}: Props) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const editando = trabalhos.find((t) => t.id === editandoId);
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
      <div className="grid gap-8 lg:grid-cols-2">
        {artistaId && (
          <FormularioTrabalho
            key={`${artistaId}/${editando?.id ?? "novo"}`}
            artistaId={artistaId}
            estilos={estilos}
            trabalho={editando}
            {...acoes}
            aoCancelar={() => setEditandoId(null)}
          />
        )}
        <section aria-labelledby="trabalhos-titulo" className="min-w-0">
          <h2 id="trabalhos-titulo" className="mb-4 font-display text-xl">
            Trabalhos cadastrados
          </h2>
          {gestao.feedback}
          {trabalhos.length === 0 && <p>Nenhum trabalho cadastrado.</p>}
          <ul className="grid gap-4">
            {trabalhos.map((t, indice) => (
              <li
                key={t.id}
                className="min-w-0 rounded-campo border-2 border-[var(--kolo-contorno)] p-4"
              >
                <Image
                  src={t.miniaturaUrl}
                  alt={t.titulo}
                  width={400}
                  height={400}
                  sizes="(max-width: 1023px) 90vw, 40vw"
                  className="mb-3 aspect-square w-full rounded-campo object-contain"
                />
                <h3 className="break-words font-semibold">{t.titulo}</h3>
                {t.destaque && <p className="text-nota font-semibold">Em destaque</p>}
                {t.regiaoCorpo && <p className="break-words text-nota">{t.regiaoCorpo}</p>}
                <p className="break-words text-nota">
                  {estilos
                    .filter((e) => t.estilos.includes(e.id))
                    .map((e) => e.nome)
                    .join(" · ")}
                </p>
                {t.descricao && <p className="break-words text-nota">{t.descricao}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="contorno"
                    disabled={gestao.pendente}
                    aria-label={`Editar ${t.titulo}`}
                    onClick={() => {
                      setEditandoId(t.id);
                      gestao.limpar();
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="contorno"
                    disabled={gestao.pendente || indice === 0}
                    aria-label={`Mover ${t.titulo} para cima`}
                    onClick={() =>
                      void gestao.executar(
                        () => mover({ id: t.id, direcao: "antes" }),
                        () => undefined,
                        "Ordem atualizada.",
                      )
                    }
                  >
                    Mover para cima
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="contorno"
                    disabled={gestao.pendente || indice === trabalhos.length - 1}
                    aria-label={`Mover ${t.titulo} para baixo`}
                    onClick={() =>
                      void gestao.executar(
                        () => mover({ id: t.id, direcao: "depois" }),
                        () => undefined,
                        "Ordem atualizada.",
                      )
                    }
                  >
                    Mover para baixo
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
        </section>
      </div>
    </div>
  );
}
