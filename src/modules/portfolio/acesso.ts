import { Prisma } from "../../../generated/prisma/client";
import { sessaoDaRequisicao } from "../../lib/auth";
import { obterPrisma } from "../../lib/prisma";
import { ErroGestao } from "../artists/index";
import type { ResultadoGestao } from "../artists/index";

export type Equipe = { papel: "ADMIN" | "ARTISTA"; artistaId: string | null };

// RN10: sessão, papel, situação e vínculo são relidos dentro da transação de cada operação.
export async function comoEquipe<T>(
  cabecalhos: Headers,
  executar: (tx: Prisma.TransactionClient, equipe: Equipe) => Promise<T>,
): Promise<ResultadoGestao<T>> {
  try {
    const sessao = await sessaoDaRequisicao(cabecalhos);
    if (!sessao) throw new ErroGestao("nao_autenticado", "Entre para gerenciar o portfólio.");
    const dados = await obterPrisma().$transaction(
      async (tx) => {
        const atual = await tx.session.findUnique({
          where: { token: sessao.token },
          include: { user: { include: { artist: true } } },
        });
        if (!atual || atual.expiresAt <= new Date())
          throw new ErroGestao("nao_autenticado", "Sua sessão expirou. Entre novamente.");
        const { user } = atual;
        if (
          user.status !== "ATIVO" ||
          user.deletedAt !== null ||
          (user.role !== "ADMIN" && (user.role !== "ARTISTA" || !user.artist))
        )
          throw new ErroGestao("proibido", "O portfólio é gerenciado pela equipe do Kolô.");
        return executar(tx, {
          papel: user.role as Equipe["papel"],
          artistaId: user.artist?.id ?? null,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return { ok: true, dados };
  } catch (erro) {
    if (erro instanceof ErroGestao) return { ok: false, erro: erro.codigo, mensagem: erro.message };
    if (erro instanceof Prisma.PrismaClientKnownRequestError) {
      if (erro.code === "P2034")
        return {
          ok: false,
          erro: "concorrencia",
          mensagem: "Outro trabalho mudou ao mesmo tempo. Atualize e tente novamente.",
        };
      if (erro.code === "P2025")
        return {
          ok: false,
          erro: "nao_encontrado",
          mensagem: "Trabalho não encontrado. Atualize a página.",
        };
      if (erro.code === "P2003")
        return {
          ok: false,
          erro: "invalido",
          mensagem: "Artista ou estilo não encontrado. Atualize a página.",
        };
    }
    console.error(
      "Falha na gestão do portfólio",
      erro instanceof Error ? erro.name : "erro desconhecido",
    );
    return {
      ok: false,
      erro: "indisponivel",
      mensagem: "Não foi possível concluir agora. Tente novamente.",
    };
  }
}

export async function conferirArtista(
  tx: Prisma.TransactionClient,
  equipe: Equipe,
  artistaId: string,
) {
  if (equipe.papel === "ARTISTA" && equipe.artistaId !== artistaId)
    throw new ErroGestao("proibido", "Você só pode gerenciar seu próprio portfólio.");
  const artista = await tx.artist.findFirst({
    where: { id: artistaId, user: { deletedAt: null } },
  });
  if (!artista) throw new ErroGestao("invalido", "Escolha um artista cadastrado.");
}
