"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ResultadoGestao } from "@/modules/artists";
import type { EntradaEditarObra, EntradaObra } from "@/modules/catalog";
import {
  centavosParaTexto,
  formatarPreco,
  slugDoTitulo,
  type SituacaoObra,
} from "@/modules/catalog/cliente";
import { CampoAdmin, FormularioAdmin, classeCampo, texto, useGestao } from "./formulario";
import { GestaoImagensObra, type AcoesImagemObra } from "./gestao-imagens-obra";

export type ImagemObra = {
  id: string;
  chave: string;
  chaveMiniatura: string;
  ordem: number;
  principal: boolean;
  textoAlternativo: string;
};
export type ObraAdmin = {
  id: string;
  titulo: string;
  slug: string;
  descricao: string | null;
  artistaId: string;
  artistaNome: string;
  tecnica: string | null;
  dimensoes: string | null;
  ano: number | null;
  precoCentavos: number;
  estoque: number;
  situacao: SituacaoObra;
  destaque: boolean;
  tags: string[];
  imagens: ImagemObra[];
};
type Opcao = { id: string; nome: string };
type Props = {
  registros: ObraAdmin[];
  artistas: Opcao[];
  tags: Opcao[];
  criar: (entrada: EntradaObra) => Promise<ResultadoGestao<{ id: string }>>;
  editar: (entrada: EntradaEditarObra) => Promise<ResultadoGestao<unknown>>;
  excluir: (id: string) => Promise<ResultadoGestao<unknown>>;
  // Ações das imagens da obra em edição. Server Actions num objeto: uma função comum não
  // atravessa a fronteira servidor/cliente, por isso não é um render prop.
  acoesImagem?: AcoesImagemObra;
};

const ROTULO_SITUACAO: Record<SituacaoObra, string> = {
  RASCUNHO: "Rascunho",
  DISPONIVEL: "Disponível",
  ESGOTADA: "Esgotada",
};

export function GestaoObras({
  registros,
  artistas,
  tags,
  criar,
  editar,
  excluir,
  acoesImagem,
}: Props) {
  // O id, não o objeto: depois do refresh a obra em edição vem atualizada (imagens novas).
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const editando = registros.find((obra) => obra.id === editandoId) ?? null;
  const gestao = useGestao();
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section aria-labelledby="formulario-titulo" className="min-w-0">
        <h2 id="formulario-titulo" className="mb-4 font-display text-xl">
          {editando ? "Editar obra" : "Cadastrar obra"}
        </h2>
        {gestao.feedback}
        <FormularioAdmin
          key={editando?.id ?? "nova"}
          pendente={gestao.pendente}
          enviar={(dados, form) => {
            const ficha = {
              titulo: texto(dados, "titulo"),
              slug: texto(dados, "slug"),
              artistaId: texto(dados, "artistaId"),
              preco: texto(dados, "preco"),
              estoque: texto(dados, "estoque"),
              tecnica: texto(dados, "tecnica"),
              dimensoes: texto(dados, "dimensoes"),
              ano: texto(dados, "ano"),
              descricao: texto(dados, "descricao"),
              destaque: dados.get("destaque") === "on",
              tags: dados
                .getAll("tags")
                .filter((valor): valor is string => typeof valor === "string"),
            };
            if (editando) {
              const publicada = texto(dados, "situacao") === "publicada";
              void gestao.executar(
                () => editar({ ...ficha, id: editando.id, publicada }),
                () => undefined,
                "Obra salva.",
              );
              return;
            }
            let criada: string | null = null;
            void gestao.executar(
              async () => {
                const resultado = await criar(ficha);
                if (resultado.ok) criada = resultado.dados.id;
                return resultado;
              },
              () => {
                form.reset();
                // Abre a obra recém-criada para receber as imagens.
                setEditandoId(criada);
              },
              "Obra cadastrada como rascunho. Agora adicione as imagens.",
            );
          }}
        >
          <CampoAdmin nome="titulo" rotulo="Título" valor={editando?.titulo} obrigatorio />
          <CampoAdmin nome="slug" rotulo="Slug" valor={editando?.slug} obrigatorio />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="contorno"
              size="sm"
              onClick={(evento) => {
                const campos = evento.currentTarget.form?.elements;
                const titulo = campos?.namedItem("titulo");
                const slug = campos?.namedItem("slug");
                if (titulo instanceof HTMLInputElement && slug instanceof HTMLInputElement)
                  slug.value = slugDoTitulo(titulo.value);
              }}
            >
              Gerar slug pelo título
            </Button>
            <p className="text-nota">
              Letras minúsculas, números e hífens, como metropole-em-chamas.
            </p>
          </div>
          <div className="grid gap-2">
            <label htmlFor="artistaId" className="text-nota font-semibold">
              Artista
            </label>
            <select
              id="artistaId"
              name="artistaId"
              defaultValue={editando?.artistaId ?? ""}
              required
              className={classeCampo}
            >
              <option value="">Selecione o artista</option>
              {artistas.map((artista) => (
                <option key={artista.id} value={artista.id}>
                  {artista.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="preco" className="text-nota font-semibold">
              Preço (R$)
            </label>
            <input
              id="preco"
              name="preco"
              inputMode="decimal"
              placeholder="1.234,56"
              defaultValue={editando ? centavosParaTexto(editando.precoCentavos) : ""}
              required
              className={classeCampo}
            />
          </div>
          <CampoAdmin
            nome="estoque"
            rotulo="Estoque"
            tipo="number"
            valor={String(editando?.estoque ?? 1)}
            obrigatorio
          />
          <p className="text-nota">A maioria das obras é peça única: estoque 1.</p>
          <CampoAdmin nome="tecnica" rotulo="Técnica" valor={editando?.tecnica} />
          <CampoAdmin nome="dimensoes" rotulo="Dimensões" valor={editando?.dimensoes} />
          <CampoAdmin
            nome="ano"
            rotulo="Ano"
            tipo="number"
            valor={editando && editando.ano !== null ? String(editando.ano) : ""}
          />
          <CampoAdmin nome="descricao" rotulo="Descrição" valor={editando?.descricao} longo />
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-nota font-semibold">Tags</legend>
            {tags.length === 0 && <p className="text-nota">Cadastre tags em Tags.</p>}
            {tags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="tags"
                  value={tag.id}
                  defaultChecked={editando?.tags.includes(tag.id)}
                  className="size-4 focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                {tag.nome}
              </label>
            ))}
          </fieldset>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="destaque"
              defaultChecked={editando?.destaque}
              className="size-4 focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            Destacar na home
          </label>
          {editando && (
            <div className="grid gap-2">
              <label htmlFor="situacao" className="text-nota font-semibold">
                Situação
              </label>
              <select
                id="situacao"
                name="situacao"
                defaultValue={editando.situacao === "RASCUNHO" ? "rascunho" : "publicada"}
                className={classeCampo}
              >
                <option value="rascunho">Rascunho</option>
                <option value="publicada">Publicada</option>
              </select>
              <p className="text-nota">
                Publicar exige pelo menos uma imagem. Publicada fica disponível com estoque acima de
                0 e esgotada com estoque 0.
              </p>
            </div>
          )}
          <Button type="submit">{gestao.pendente ? "Salvando…" : "Salvar obra"}</Button>
          {editando && (
            <Button
              type="button"
              variant="contorno"
              onClick={() => {
                setEditandoId(null);
                gestao.limpar();
              }}
            >
              Cancelar edição
            </Button>
          )}
        </FormularioAdmin>
        {editando && acoesImagem && <GestaoImagensObra obra={editando} {...acoesImagem} />}
      </section>
      <section aria-labelledby="lista-titulo" className="min-w-0">
        <h2 id="lista-titulo" className="mb-4 font-display text-xl">
          Obras cadastradas
        </h2>
        {registros.length === 0 ? (
          <p>Nenhuma obra cadastrada.</p>
        ) : (
          <ul aria-labelledby="lista-titulo" className="grid gap-3">
            {registros.map((obra) => (
              <li
                key={obra.id}
                className="rounded-campo border-2 border-[var(--kolo-contorno)] p-4"
              >
                <p className="break-words font-semibold">{obra.titulo}</p>
                <p className="break-words text-nota">
                  {obra.artistaNome} · {ROTULO_SITUACAO[obra.situacao]}
                  {obra.destaque && " · Destaque"}
                </p>
                <p className="text-nota">
                  {formatarPreco(obra.precoCentavos)} · Estoque: {obra.estoque} ·{" "}
                  {obra.imagens.length === 1 ? "1 imagem" : `${obra.imagens.length} imagens`}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="contorno"
                    disabled={gestao.pendente}
                    aria-label={`Editar ${obra.titulo}`}
                    onClick={() => {
                      setEditandoId(obra.id);
                      gestao.limpar();
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="contorno"
                    disabled={gestao.pendente}
                    aria-label={`Excluir ${obra.titulo}`}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Excluir a obra “${obra.titulo}”? Se ela estiver em carrinho ou pedido, será arquivada: sai da vitrine, mas o histórico fica preservado.`,
                        )
                      )
                        void gestao.executar(
                          () => excluir(obra.id),
                          () => {
                            if (editandoId === obra.id) setEditandoId(null);
                          },
                          "Obra excluída. Se estava em carrinho ou pedido, foi arquivada.",
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
