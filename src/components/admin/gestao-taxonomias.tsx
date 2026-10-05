"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { EntradaTaxonomia, ResultadoGestao, TipoTaxonomia } from "@/modules/artists";
import { CampoAdmin, FormularioAdmin, texto, useGestao } from "./formulario";

type Registro = { id: string; nome: string; slug: string; descricao: string | null };
export function GestaoTaxonomias({
  tipo,
  registros,
  salvar,
  excluir,
}: {
  tipo: TipoTaxonomia;
  registros: Registro[];
  salvar: (entrada: EntradaTaxonomia, id?: string) => Promise<ResultadoGestao<unknown>>;
  excluir: (id: string) => Promise<ResultadoGestao<unknown>>;
}) {
  const [editando, setEditando] = useState<Registro | null>(null);
  const gestao = useGestao();
  const singular = tipo === "estilos" ? "estilo" : "tag";
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section aria-labelledby="formulario-titulo" className="min-w-0">
        <h2 id="formulario-titulo" className="mb-4 font-display text-xl">
          {editando ? "Editar" : "Cadastrar"} {singular}
        </h2>
        {gestao.feedback}
        <FormularioAdmin
          key={editando?.id ?? "novo"}
          pendente={gestao.pendente}
          enviar={(dados, form) => {
            void gestao.executar(
              () =>
                salvar(
                  {
                    nome: texto(dados, "nome"),
                    slug: texto(dados, "slug"),
                    descricao: texto(dados, "descricao"),
                  },
                  editando?.id,
                ),
              () => {
                form.reset();
                setEditando(null);
              },
              "Salvo com sucesso.",
            );
          }}
        >
          <CampoAdmin nome="nome" rotulo="Nome" valor={editando?.nome} obrigatorio />
          <CampoAdmin nome="slug" rotulo="Slug" valor={editando?.slug} obrigatorio />
          <p className="text-nota">Use letras minúsculas, números e hífens, como arte-urbana.</p>
          {tipo === "estilos" && (
            <CampoAdmin nome="descricao" rotulo="Descrição" valor={editando?.descricao} longo />
          )}
          <Button type="submit">{gestao.pendente ? "Salvando…" : `Salvar ${singular}`}</Button>
          {editando && (
            <Button
              type="button"
              variant="contorno"
              onClick={() => {
                setEditando(null);
                gestao.limpar();
              }}
            >
              Cancelar edição
            </Button>
          )}
        </FormularioAdmin>
      </section>
      <section aria-labelledby="lista-titulo" className="min-w-0">
        <h2 id="lista-titulo" className="mb-4 font-display text-xl">
          {tipo === "estilos" ? "Estilos cadastrados" : "Tags cadastradas"}
        </h2>
        {registros.length === 0 ? (
          <p>Nenhum {singular} cadastrado.</p>
        ) : (
          <ul className="grid gap-3">
            {registros.map((registro) => (
              <li
                key={registro.id}
                className="rounded-campo border-2 border-[var(--kolo-contorno)] p-4"
              >
                <p className="break-words font-semibold">{registro.nome}</p>
                <p className="break-words text-nota">{registro.slug}</p>
                {registro.descricao && (
                  <p className="break-words text-nota">{registro.descricao}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="contorno"
                    disabled={gestao.pendente}
                    aria-label={`Editar ${registro.nome}`}
                    onClick={() => {
                      setEditando(registro);
                      gestao.limpar();
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="contorno"
                    disabled={gestao.pendente}
                    aria-label={`Excluir ${registro.nome}`}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Excluir ${singular} “${registro.nome}”? A ação só será permitida se não houver vínculos.`,
                        )
                      )
                        void gestao.executar(
                          () => excluir(registro.id),
                          () => {
                            if (editando?.id === registro.id) setEditando(null);
                          },
                          "Excluído com sucesso.",
                        );
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
