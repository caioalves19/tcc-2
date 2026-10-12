"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadImagem } from "@/components/media/upload-imagem";
import { CampoAdmin, FormularioAdmin, texto, useGestao } from "@/components/admin/formulario";
import type { EntradaUpload, ResultadoUpload, ResultadoProcessamento } from "@/modules/media";
import type { ResultadoPortfolio, TrabalhoPortfolio } from "@/modules/portfolio";

export type AcoesFormulario = {
  criar: (entrada: unknown) => Promise<ResultadoPortfolio<unknown>>;
  editar: (entrada: unknown) => Promise<ResultadoPortfolio<unknown>>;
  solicitar: (entrada: EntradaUpload) => Promise<ResultadoUpload>;
  processar: (chave: string) => Promise<ResultadoProcessamento>;
};

type Props = AcoesFormulario & {
  artistaId: string;
  estilos: { id: string; nome: string }[];
  trabalho?: TrabalhoPortfolio;
  aoCancelar: () => void;
};

export function FormularioTrabalho({
  artistaId,
  estilos,
  trabalho,
  criar,
  editar,
  solicitar,
  processar,
  aoCancelar,
}: Props) {
  const gestao = useGestao();
  const [enviando, setEnviando] = useState(false);
  const [imagemPendente, setImagemPendente] = useState(false);
  const [chave, setChave] = useState<string>();
  const [erroImagem, setErroImagem] = useState(false);
  const [versaoUpload, setVersaoUpload] = useState(0);
  return (
    <section
      aria-labelledby="formulario-trabalho-titulo"
      className="min-w-0 [&_fieldset]:min-w-0 [&_fieldset]:grid-cols-1 [&_input]:max-w-full"
    >
      <h2 id="formulario-trabalho-titulo" className="mb-4 font-display text-xl">
        {trabalho ? "Editar trabalho" : "Cadastrar trabalho"}
      </h2>
      {gestao.feedback}
      <FormularioAdmin
        pendente={gestao.pendente}
        enviar={(dados, form) => {
          if (enviando || imagemPendente) return;
          if (!trabalho && !chave) {
            setErroImagem(true);
            return;
          }
          const ficha = {
            artistaId,
            titulo: texto(dados, "titulo"),
            descricao: texto(dados, "descricao"),
            regiaoCorpo: texto(dados, "regiaoCorpo"),
            destaque: dados.get("destaque") === "on",
            estilos: dados.getAll("estilos").filter((v): v is string => typeof v === "string"),
            ...(chave ? { chave } : {}),
          };
          void gestao.executar(
            () => (trabalho ? editar({ ...ficha, id: trabalho.id }) : criar(ficha)),
            () => {
              setChave(undefined);
              setVersaoUpload((v) => v + 1);
              if (!trabalho) form.reset();
            },
            trabalho ? "Trabalho salvo." : "Trabalho cadastrado.",
          );
        }}
      >
        <CampoAdmin nome="titulo" rotulo="Título" valor={trabalho?.titulo} obrigatorio />
        <CampoAdmin nome="descricao" rotulo="Descrição" valor={trabalho?.descricao} longo />
        <p className="text-nota">
          Descreva a tatuagem no título e na descrição para ajudar quem usa leitor de tela.
        </p>
        <CampoAdmin nome="regiaoCorpo" rotulo="Região do corpo" valor={trabalho?.regiaoCorpo} />
        <fieldset className="grid gap-2">
          <legend className="mb-2 font-semibold">Estilos</legend>
          {estilos.length === 0 && <p>Nenhum estilo cadastrado.</p>}
          {estilos.map((e) => (
            <label key={e.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="estilos"
                value={e.id}
                defaultChecked={trabalho?.estilos.includes(e.id)}
              />
              {e.nome}
            </label>
          ))}
        </fieldset>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="destaque" defaultChecked={trabalho?.destaque} />
          Destacar trabalho
        </label>
        {trabalho && (
          <p className="text-nota">Envie outra imagem somente se quiser substituir a atual.</p>
        )}
        <UploadImagem
          key={versaoUpload}
          destino="portfolio"
          aoEnviar={(pendente) => {
            setEnviando(pendente);
            if (pendente) {
              setChave(undefined);
              setImagemPendente(true);
            }
          }}
          artistId={artistaId}
          solicitar={solicitar}
          processar={processar}
          aoConcluir={(imagem) => {
            setChave(imagem.chave);
            setImagemPendente(false);
            setErroImagem(false);
          }}
        />
        {erroImagem && <p role="alert">Envie uma imagem antes de salvar o trabalho.</p>}
        {trabalho && imagemPendente && !enviando && (
          <Button
            type="button"
            variant="contorno"
            onClick={() => {
              setImagemPendente(false);
              setChave(undefined);
              setErroImagem(false);
              setVersaoUpload((v) => v + 1);
            }}
          >
            Manter imagem atual
          </Button>
        )}
        <Button type="submit" disabled={enviando || imagemPendente}>
          {gestao.pendente ? "Salvando…" : "Salvar trabalho"}
        </Button>
        {trabalho && (
          <Button type="button" variant="contorno" onClick={aoCancelar}>
            Cancelar edição
          </Button>
        )}
      </FormularioAdmin>
    </section>
  );
}
