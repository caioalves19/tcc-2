import type { z } from "zod";
import { Prisma } from "../../../generated/prisma/client";
import { sessaoDaRequisicao } from "../../lib/auth";
import { obterPrisma } from "../../lib/prisma";
import type { ResultadoGestao } from "./validacao";

export class ErroGestao extends Error {
  constructor(
    public codigo: string,
    mensagem: string,
  ) {
    super(mensagem);
  }
}
export function validar<T>(schema: z.ZodType<T>, entrada: unknown): T {
  const resultado = schema.safeParse(entrada);
  if (!resultado.success)
    throw new ErroGestao("invalido", resultado.error.issues.map((i) => i.message).join(" "));
  return resultado.data;
}

// Toda leitura e escrita passa por sessão assinada e autorização atual no banco.
// Serializable impede que checagem de vínculos + exclusão percam uma associação concorrente.
export async function comoAdmin<T>(
  cabecalhos: Headers,
  executar: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<ResultadoGestao<T>> {
  try {
    const sessao = await sessaoDaRequisicao(cabecalhos);
    if (!sessao) throw new ErroGestao("nao_autenticado", "Sua sessão expirou. Entre novamente.");
    if (sessao.papel !== "ADMIN")
      throw new ErroGestao("proibido", "Acesso exclusivo de administradores.");
    const dados = await obterPrisma().$transaction(
      async (tx) => {
        const atual = await tx.session.findUnique({
          where: { token: sessao.token },
          include: { user: true },
        });
        if (!atual || atual.expiresAt <= new Date())
          throw new ErroGestao("nao_autenticado", "Sua sessão expirou. Entre novamente.");
        if (
          atual.user.role !== "ADMIN" ||
          atual.user.status !== "ATIVO" ||
          atual.user.deletedAt !== null
        )
          throw new ErroGestao("proibido", "Acesso exclusivo de administradores ativos.");
        return executar(tx);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return { ok: true, dados };
  } catch (erro) {
    if (erro instanceof ErroGestao) return { ok: false, erro: erro.codigo, mensagem: erro.message };
    if (erro instanceof Prisma.PrismaClientKnownRequestError) {
      const mensagens: Record<string, [string, string]> = {
        P2002: ["duplicado", "Nome, slug, e-mail ou conta já cadastrados. Verifique os dados."],
        P2003: ["vinculado", "O registro possui vínculos ou uma referência não existe."],
        P2025: ["nao_encontrado", "Registro não encontrado. Atualize a página."],
        P2034: [
          "concorrencia",
          "Outro cadastro foi alterado ao mesmo tempo. Atualize e tente novamente.",
        ],
      };
      const mensagem = mensagens[erro.code];
      if (mensagem) return { ok: false, erro: mensagem[0], mensagem: mensagem[1] };
    }
    console.error(
      "Falha na gestão do acervo",
      erro instanceof Error ? erro.name : "erro desconhecido",
    );
    return {
      ok: false,
      erro: "indisponivel",
      mensagem: "Não foi possível concluir agora. Tente novamente.",
    };
  }
}

export function verificarAcessoAdmin(cabecalhos: Headers) {
  return comoAdmin(cabecalhos, async () => undefined);
}
