"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { EntradaArtista, EntradaEditarArtista, ResultadoGestao } from "@/modules/artists";
import { CampoAdmin, FormularioAdmin, classeCampo, texto, useGestao } from "./formulario";

type Artista = {
  id: string;
  userId: string;
  nome: string;
  email: string;
  telefone: string;
  slug: string;
  bio: string | null;
  avatarUrl: string | null;
  instagram: string | null;
  estilos: string[];
};
type Props = {
  registros: Artista[];
  contas: { id: string; name: string; email: string }[];
  estilos: { id: string; nome: string }[];
  criar: (entrada: EntradaArtista) => Promise<ResultadoGestao<unknown>>;
  editar: (entrada: EntradaEditarArtista) => Promise<ResultadoGestao<unknown>>;
  excluir: (id: string) => Promise<ResultadoGestao<unknown>>;
};
export function GestaoArtistas({ registros, contas, estilos, criar, editar, excluir }: Props) {
  const [editando, setEditando] = useState<Artista | null>(null);
  const [modo, setModo] = useState<"novo" | "existente">("novo");
  const gestao = useGestao();
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section aria-labelledby="formulario-titulo" className="min-w-0">
        <h2 id="formulario-titulo" className="mb-4 font-display text-xl">
          {editando ? "Editar artista" : "Cadastrar artista"}
        </h2>
        {gestao.feedback}
        {!editando && (
          <div className="mb-4 grid gap-2">
            <label htmlFor="modo" className="text-nota font-semibold">
              Conta do artista
            </label>
            <select
              id="modo"
              value={modo}
              disabled={gestao.pendente}
              className={classeCampo}
              onChange={(evento) => {
                setModo(evento.target.value === "existente" ? "existente" : "novo");
                gestao.limpar();
              }}
            >
              <option value="novo">Criar nova conta</option>
              <option value="existente">Vincular conta existente</option>
            </select>
          </div>
        )}
        <FormularioAdmin
          key={editando?.id ?? modo}
          pendente={gestao.pendente}
          enviar={(dados, form) => {
            const perfil = {
              slug: texto(dados, "slug"),
              bio: texto(dados, "bio"),
              avatarUrl: texto(dados, "avatarUrl"),
              instagram: texto(dados, "instagram"),
              estilos: dados
                .getAll("estilos")
                .filter((valor): valor is string => typeof valor === "string"),
            };
            const pessoa = { nome: texto(dados, "nome"), telefone: texto(dados, "telefone") };
            const acao = editando
              ? () => editar({ ...perfil, ...pessoa, id: editando.id })
              : modo === "novo"
                ? () =>
                    criar({
                      ...perfil,
                      ...pessoa,
                      modo: "novo",
                      email: texto(dados, "email"),
                      senha: texto(dados, "senha"),
                    })
                : () => criar({ ...perfil, modo: "existente", userId: texto(dados, "userId") });
            void gestao.executar(
              acao,
              () => {
                form.reset();
                setEditando(null);
              },
              "Salvo com sucesso.",
            );
          }}
        >
          {!editando && modo === "existente" ? (
            <div className="grid gap-2">
              <label htmlFor="userId" className="text-nota font-semibold">
                Usuário existente
              </label>
              <select id="userId" name="userId" defaultValue="" required className={classeCampo}>
                <option value="">Selecione uma conta</option>
                {contas.map((conta) => (
                  <option key={conta.id} value={conta.id}>
                    {conta.name} — {conta.email}
                  </option>
                ))}
              </select>
              <p className="text-nota">
                A conta precisa estar ativa e sem perfil de artista. Contas CLIENTE passarão a
                ARTISTA.
              </p>
              {contas.length === 0 && (
                <p>Nenhuma conta disponível. Escolha criar uma nova conta.</p>
              )}
            </div>
          ) : (
            <>
              <CampoAdmin nome="nome" rotulo="Nome" valor={editando?.nome} obrigatorio />
              {editando ? (
                <p className="break-words text-nota">E-mail da conta: {editando.email}</p>
              ) : (
                <CampoAdmin nome="email" rotulo="E-mail" tipo="email" obrigatorio />
              )}
              <CampoAdmin
                nome="telefone"
                rotulo="Telefone"
                tipo="tel"
                valor={editando?.telefone}
                obrigatorio
              />
              {!editando && (
                <>
                  <CampoAdmin nome="senha" rotulo="Senha inicial" tipo="password" obrigatorio />
                  <p className="text-nota">
                    Use entre 8 e 128 caracteres. A senha pode ser alterada pelo artista em Minha
                    conta.
                  </p>
                </>
              )}
            </>
          )}
          <CampoAdmin nome="slug" rotulo="Slug" valor={editando?.slug} obrigatorio />
          <p className="text-nota">Use letras minúsculas, números e hífens, como ana-silva.</p>
          <CampoAdmin nome="bio" rotulo="Biografia" valor={editando?.bio} longo />
          <CampoAdmin
            nome="avatarUrl"
            rotulo="URL do avatar (HTTPS)"
            tipo="url"
            valor={editando?.avatarUrl}
          />
          <CampoAdmin nome="instagram" rotulo="Usuário do Instagram" valor={editando?.instagram} />
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-nota font-semibold">Estilos do artista</legend>
            {estilos.length === 0 && (
              <p className="text-nota">Cadastre estilos para associá-los ao artista.</p>
            )}
            {estilos.map((estilo) => (
              <label key={estilo.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="estilos"
                  value={estilo.id}
                  defaultChecked={editando?.estilos.includes(estilo.id)}
                  className="size-4 focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                {estilo.nome}
              </label>
            ))}
          </fieldset>
          <Button type="submit">{gestao.pendente ? "Salvando…" : "Salvar artista"}</Button>
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
          Artistas cadastrados
        </h2>
        {registros.length === 0 ? (
          <p>Nenhum artista cadastrado.</p>
        ) : (
          <ul className="grid gap-3">
            {registros.map((artista) => (
              <li
                key={artista.id}
                className="rounded-campo border-2 border-[var(--kolo-contorno)] p-4"
              >
                <p className="break-words font-semibold">{artista.nome}</p>
                <p className="break-words text-nota">
                  {artista.email} · {artista.slug}
                </p>
                <p className="text-nota">
                  Estilos:{" "}
                  {estilos
                    .filter((estilo) => artista.estilos.includes(estilo.id))
                    .map((estilo) => estilo.nome)
                    .join(", ") || "Nenhum"}
                </p>
                {artista.bio && <p className="break-words text-nota">{artista.bio}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="contorno"
                    disabled={gestao.pendente}
                    aria-label={`Editar ${artista.nome}`}
                    onClick={() => {
                      setEditando(artista);
                      gestao.limpar();
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="contorno"
                    disabled={gestao.pendente}
                    aria-label={`Excluir ${artista.nome}`}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Excluir o perfil de “${artista.nome}”? A conta será preservada; uma conta ARTISTA passará a CLIENTE e suas sessões serão encerradas.`,
                        )
                      )
                        void gestao.executar(
                          () => excluir(artista.id),
                          () => {
                            if (editando?.id === artista.id) setEditando(null);
                          },
                          "Perfil excluído. A conta foi preservada.",
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
