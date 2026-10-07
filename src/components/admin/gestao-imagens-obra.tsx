"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UploadImagem } from "@/components/media/upload-imagem";
import type { ResultadoGestao } from "@/modules/artists";
import type { EntradaUpload, ResultadoUpload } from "@/modules/media";
import { classeCampo, useGestao } from "./formulario";
import type { ImagemObra } from "./gestao-obras";

export type AcoesImagemObra = {
  // URL pública do R2 (R2_PUBLIC_URL); sem ela, a lista mostra "Sem prévia".
  baseImagens: string | null;
  solicitar: (entrada: EntradaUpload) => Promise<ResultadoUpload>;
  adicionar: (entrada: {
    obraId: string;
    chave: string;
    textoAlternativo: string;
  }) => Promise<ResultadoGestao<{ id: string; chaveMiniatura: string }>>;
  definirPrincipal: (imagemId: string) => Promise<ResultadoGestao<unknown>>;
  mover: (imagemId: string, direcao: "antes" | "depois") => Promise<ResultadoGestao<unknown>>;
  editarTexto: (imagemId: string, texto: string) => Promise<ResultadoGestao<unknown>>;
  remover: (imagemId: string) => Promise<ResultadoGestao<unknown>>;
  enviar?: (url: string, init: RequestInit) => Promise<{ ok: boolean }>;
};
type Props = AcoesImagemObra & {
  obra: { id: string; artistaId: string; imagens: ImagemObra[] };
};

export function GestaoImagensObra({
  obra,
  baseImagens,
  solicitar,
  adicionar,
  definirPrincipal,
  mover,
  editarTexto,
  remover,
  enviar,
}: Props) {
  const router = useRouter();
  const gestao = useGestao();
  const [texto, setTexto] = useState("");
  const [enviadas, setEnviadas] = useState(0);
  // RNF21: sem texto alternativo o envio nem começa, e assim não sobra arquivo órfão no R2.
  const liberado = texto.trim().length >= 3;
  const base = baseImagens?.replace(/\/+$/, "") ?? null;
  const ultima = obra.imagens.length - 1;
  return (
    <section aria-labelledby="imagens-titulo" className="mt-10 grid gap-4">
      <h3 id="imagens-titulo" className="font-display text-lg">
        Imagens
      </h3>
      {gestao.feedback}
      {enviadas > 0 && (
        <p role="status" className="text-corpo">
          Imagem adicionada. Escreva o texto da próxima para enviar outra.
        </p>
      )}
      <div className="grid gap-2">
        <label htmlFor="texto-nova-imagem" className="text-nota font-semibold">
          Texto alternativo da nova imagem
        </label>
        <input
          id="texto-nova-imagem"
          value={texto}
          maxLength={200}
          onChange={(evento) => setTexto(evento.target.value)}
          className={classeCampo}
        />
        <p className="text-nota">
          Descreva o que aparece na foto, para quem usa leitor de tela. O envio é liberado depois
          disso.
        </p>
      </div>
      {liberado && (
        <UploadImagem
          key={enviadas}
          destino="obras"
          artistId={obra.artistaId}
          solicitar={solicitar}
          processar={(chave) =>
            adicionar({ obraId: obra.id, chave, textoAlternativo: texto.trim() })
          }
          aoConcluir={() => {
            setTexto("");
            setEnviadas((total) => total + 1);
            router.refresh();
          }}
          enviar={enviar}
        />
      )}
      {obra.imagens.length === 0 ? (
        <p>Nenhuma imagem ainda. A primeira enviada vira a principal.</p>
      ) : (
        <ul aria-label="Imagens da obra" className="grid gap-3">
          {obra.imagens.map((imagem, indice) => {
            const nome = imagem.textoAlternativo;
            const executar = (acao: () => Promise<ResultadoGestao<unknown>>, mensagem: string) =>
              void gestao.executar(acao, () => undefined, mensagem);
            return (
              <li
                key={imagem.id}
                className="grid gap-3 rounded-campo border-2 border-[var(--kolo-contorno)] p-3 sm:grid-cols-[6rem_minmax(0,1fr)]"
              >
                {base ? (
                  // Miniatura do próprio bucket (WebP do PBI-17); next/image fica para a vitrine.
                  <img
                    src={`${base}/${imagem.chaveMiniatura}`}
                    alt={nome}
                    width={96}
                    height={96}
                    loading="lazy"
                    className="size-24 rounded-campo object-cover"
                  />
                ) : (
                  <div className="grid size-24 place-items-center rounded-campo border-2 border-dashed border-[var(--kolo-contorno)] text-center text-nota">
                    Sem prévia
                  </div>
                )}
                <div className="grid min-w-0 gap-2">
                  {imagem.principal && <p className="text-nota font-semibold">Principal</p>}
                  <form
                    className="grid gap-2"
                    onSubmit={(evento) => {
                      evento.preventDefault();
                      const campo = evento.currentTarget.elements.namedItem("texto");
                      if (campo instanceof HTMLInputElement)
                        executar(() => editarTexto(imagem.id, campo.value), "Texto salvo.");
                    }}
                  >
                    <label htmlFor={`texto-${imagem.id}`} className="text-nota font-semibold">
                      Texto alternativo
                    </label>
                    <input
                      id={`texto-${imagem.id}`}
                      name="texto"
                      defaultValue={nome}
                      maxLength={200}
                      className={classeCampo}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant="contorno"
                      disabled={gestao.pendente}
                      aria-label={`Salvar texto ${nome}`}
                    >
                      Salvar texto
                    </Button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="contorno"
                      disabled={gestao.pendente || imagem.principal}
                      aria-label={`Tornar principal ${nome}`}
                      onClick={() =>
                        executar(() => definirPrincipal(imagem.id), "Imagem principal trocada.")
                      }
                    >
                      Tornar principal
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="contorno"
                      disabled={gestao.pendente || indice === 0}
                      aria-label={`Subir ${nome}`}
                      onClick={() => executar(() => mover(imagem.id, "antes"), "Ordem salva.")}
                    >
                      Subir
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="contorno"
                      disabled={gestao.pendente || indice === ultima}
                      aria-label={`Descer ${nome}`}
                      onClick={() => executar(() => mover(imagem.id, "depois"), "Ordem salva.")}
                    >
                      Descer
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="contorno"
                      disabled={gestao.pendente}
                      aria-label={`Remover ${nome}`}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remover a imagem “${nome}”? O arquivo sai do armazenamento.`,
                          )
                        )
                          executar(() => remover(imagem.id), "Imagem removida.");
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
