"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MENSAGENS_UPLOAD, validarImagem } from "@/modules/media/cliente";
import type { EntradaUpload, ResultadoProcessamento, ResultadoUpload } from "@/modules/media";

type Concluido = { chave: string; chaveMiniatura: string };
type Envio = (url: string, init: RequestInit) => Promise<{ ok: boolean }>;

const FALHA_NO_ENVIO = "Não foi possível enviar a imagem. Tente de novo.";

export function UploadImagem({
  destino,
  artistId,
  solicitar,
  processar,
  aoConcluir,
  enviar = fetch,
}: {
  destino: EntradaUpload["destino"];
  artistId: string;
  solicitar: (entrada: EntradaUpload) => Promise<ResultadoUpload>;
  processar: (chave: string) => Promise<ResultadoProcessamento>;
  aoConcluir: (imagem: Concluido) => void;
  enviar?: Envio;
}) {
  const [estado, setEstado] = useState<"ocioso" | "enviando" | "sucesso">("ocioso");
  const [erro, setErro] = useState<string | null>(null);
  const [imagem, setImagem] = useState<File | null>(null);

  function falhar(mensagem: string) {
    setEstado("ocioso");
    setErro(mensagem);
  }

  // A cada tentativa a assinatura e a chave são novas: uma URL assinada vale uma tentativa.
  async function iniciar(arquivo: File) {
    setErro(null);
    setImagem(arquivo);
    const validacao = validarImagem({ tipo: arquivo.type, tamanho: arquivo.size });
    if (!validacao.ok) return falhar(MENSAGENS_UPLOAD[validacao.motivo] ?? "Imagem inválida.");
    setEstado("enviando");
    try {
      const assinado = await solicitar({
        destino,
        artistId,
        tipo: arquivo.type,
        tamanho: arquivo.size,
      });
      if (!assinado.ok) return falhar(assinado.mensagem);
      const resposta = await enviar(assinado.dados.url, {
        method: "PUT",
        headers: assinado.dados.cabecalhos,
        body: arquivo,
      });
      if (!resposta.ok) return falhar(FALHA_NO_ENVIO);
      const processado = await processar(assinado.dados.chave);
      if (!processado.ok) return falhar(processado.mensagem);
      setEstado("sucesso");
      aoConcluir({ chave: assinado.dados.chave, chaveMiniatura: processado.dados.chaveMiniatura });
    } catch {
      falhar(FALHA_NO_ENVIO);
    }
  }

  return (
    <div className="grid gap-3">
      <label htmlFor="imagem">Imagem</label>
      <input
        id="imagem"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={estado === "enviando"}
        onChange={(evento) => {
          const escolhida = evento.target.files?.[0];
          if (escolhida) void iniciar(escolhida);
        }}
      />
      {estado === "enviando" && <p role="status">Enviando imagem…</p>}
      {estado === "sucesso" && <p role="status">Imagem enviada com sucesso.</p>}
      {erro && <p role="alert">{erro}</p>}
      {erro && imagem && (
        <Button type="button" onClick={() => void iniciar(imagem)}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
