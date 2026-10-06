import { autorizarUpload } from "./autorizacao";
import type { DestinoImagem } from "./chave";
import { gerarMiniatura, type Armazenamento } from "./miniatura";
import { armazenamentoR2 } from "./r2";

export type ResultadoProcessamento =
  { ok: true; dados: { chaveMiniatura: string } } | { ok: false; erro: string; mensagem: string };

// Só o formato que gerarChaveObjeto produz: nada de miniatura, subpasta ou extensão estranha.
const CHAVE_ORIGINAL =
  /^(obras|portfolio)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/i;

const MENSAGENS: Record<string, string> = {
  chave_invalida: "Imagem inválida.",
  nao_autenticado: "Sua sessão expirou. Entre novamente.",
  proibido: "Você não tem permissão para processar esta imagem.",
  artista_inexistente: "Artista não encontrado.",
  imagem_invalida: "O arquivo enviado não é uma imagem JPEG, PNG ou WebP válida.",
  indisponivel: "Não foi possível processar agora. Tente novamente.",
};

function falha(erro: string): ResultadoProcessamento {
  return { ok: false, erro, mensagem: MENSAGENS[erro] ?? MENSAGENS.indisponivel! };
}

// O destino e o artista saem da própria chave, e a permissão é checada sobre eles: quem
// pode enviar para um perfil é quem pode pedir o processamento dos objetos dele.
export async function processarImagem(
  chave: string,
  cabecalhos: Headers,
  armazenamento?: Armazenamento,
): Promise<ResultadoProcessamento> {
  const partes = typeof chave === "string" ? CHAVE_ORIGINAL.exec(chave) : null;
  if (!partes) return falha("chave_invalida");
  const permissao = await autorizarUpload(cabecalhos, {
    destino: partes[1] as DestinoImagem,
    artistId: partes[2]!,
  });
  if (!permissao.ok) return falha(permissao.erro);
  try {
    // Criado aqui dentro: R2 mal configurado vira "indisponivel", não exceção solta.
    const resultado = await gerarMiniatura(chave, armazenamento ?? armazenamentoR2());
    return resultado.ok
      ? { ok: true, dados: { chaveMiniatura: resultado.chaveMiniatura } }
      : falha(resultado.motivo);
  } catch (erro) {
    console.error(
      "Falha ao gerar miniatura",
      erro instanceof Error ? erro.name : "erro desconhecido",
    );
    return falha("indisponivel");
  }
}
