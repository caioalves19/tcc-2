import { z } from "zod";
import { autorizarUpload } from "./autorizacao";
import { gerarChaveObjeto, type DestinoImagem } from "./chave";
import { MENSAGENS_UPLOAD } from "./mensagens";
import { assinarComR2 } from "./r2";
import { validarImagem } from "./validacao";

const EXPIRACAO_SEGUNDOS = 5 * 60;

export type PedidoAssinatura = {
  chave: string;
  tipo: string;
  tamanho: number;
  expiraEmSegundos: number;
};
export type Assinador = (pedido: PedidoAssinatura) => Promise<string>;

export type EntradaUpload = {
  destino: DestinoImagem;
  artistId: string;
  tipo: string;
  tamanho: number;
};
export type UploadAssinado = {
  url: string;
  chave: string;
  cabecalhos: { "Content-Type": string };
  expiraEm: string;
};
export type ResultadoUpload =
  { ok: true; dados: UploadAssinado } | { ok: false; erro: string; mensagem: string };

function falha(erro: string): ResultadoUpload {
  return { ok: false, erro, mensagem: MENSAGENS_UPLOAD[erro] ?? "Não foi possível enviar agora." };
}

// RNF09: os tipos do TypeScript não existem em tempo de execução; a Server Action recebe o
// que o navegador mandar, inclusive null ou campos de outro tipo.
const schemaEntradaUpload = z.object({
  destino: z.enum(["obras", "portfolio"]),
  artistId: z.uuid(),
  tipo: z.string(),
  tamanho: z.number(),
});

// A entrada vem de uma Server Action: nada dela é confiável até passar por aqui.
export async function solicitarUpload(
  bruta: EntradaUpload,
  cabecalhos: Headers,
  assinar: Assinador = assinarComR2,
): Promise<ResultadoUpload> {
  const lida = schemaEntradaUpload.safeParse(bruta);
  if (!lida.success) {
    const soDestino = lida.error.issues.every((issue) => issue.path[0] === "destino");
    return falha(soDestino ? "destino_invalido" : "entrada_invalida");
  }
  const entrada = lida.data;
  const arquivo = validarImagem({ tipo: entrada.tipo, tamanho: entrada.tamanho });
  if (!arquivo.ok) return falha(arquivo.motivo);
  const permissao = await autorizarUpload(cabecalhos, {
    destino: entrada.destino,
    artistId: entrada.artistId,
  });
  if (!permissao.ok) return falha(permissao.erro);

  const chave = gerarChaveObjeto(entrada);
  let url: string;
  try {
    url = await assinar({
      chave,
      tipo: entrada.tipo,
      tamanho: entrada.tamanho,
      expiraEmSegundos: EXPIRACAO_SEGUNDOS,
    });
  } catch (erro) {
    // A mensagem do provedor pode conter endpoint ou credencial: só o tipo do erro vai ao log.
    console.error(
      "Falha ao assinar upload",
      erro instanceof Error ? erro.name : "erro desconhecido",
    );
    return falha("indisponivel");
  }
  return {
    ok: true,
    dados: {
      url,
      chave,
      cabecalhos: { "Content-Type": entrada.tipo },
      expiraEm: new Date(Date.now() + EXPIRACAO_SEGUNDOS * 1000).toISOString(),
    },
  };
}
