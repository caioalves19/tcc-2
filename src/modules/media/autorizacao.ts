import { sessaoDaRequisicao } from "../../lib/auth";
import { obterPrisma } from "../../lib/prisma";
import type { DestinoImagem } from "./chave";

export type ResultadoAutorizacao =
  { ok: true } | { ok: false; erro: "nao_autenticado" | "proibido" | "artista_inexistente" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// O papel, a situação e o vínculo com o artista são relidos no banco a cada pedido: a
// sessão só identifica quem pede, nunca o que ele pode.
export async function autorizarUpload(
  cabecalhos: Headers,
  alvo: { destino: DestinoImagem; artistId: string },
): Promise<ResultadoAutorizacao> {
  const sessao = await sessaoDaRequisicao(cabecalhos);
  if (!sessao) return { ok: false, erro: "nao_autenticado" };
  const prisma = obterPrisma();
  const atual = await prisma.session.findUnique({
    where: { token: sessao.token },
    include: { user: { include: { artist: true } } },
  });
  if (!atual || atual.expiresAt <= new Date()) return { ok: false, erro: "nao_autenticado" };
  const { user } = atual;
  if (user.status !== "ATIVO" || user.deletedAt !== null) return { ok: false, erro: "proibido" };
  if (user.role === "ARTISTA") {
    return user.artist?.id === alvo.artistId ? { ok: true } : { ok: false, erro: "proibido" };
  }
  if (user.role !== "ADMIN") return { ok: false, erro: "proibido" };
  const existe =
    UUID.test(alvo.artistId) &&
    (await prisma.artist.findUnique({ where: { id: alvo.artistId }, select: { id: true } })) !==
      null;
  return existe ? { ok: true } : { ok: false, erro: "artista_inexistente" };
}
