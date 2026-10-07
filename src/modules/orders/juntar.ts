import { obterPrisma } from "../../lib/prisma";
import { carrinhoDo, hashDoToken, type ResultadoCarrinho } from "./carrinho";
import { quantidadeAoJuntar } from "./regras";

// RF11: chamado logo depois do login ou do cadastro, com o token da sessão nova. Os itens do
// visitante entram no carrinho da conta (vale a maior quantidade, limitada ao estoque) e o
// carrinho do visitante deixa de existir. Sem carrinho de visitante, não faz nada.
export async function juntarCarrinhos(
  tokenSessao: string,
  tokenVisitante: string,
): Promise<ResultadoCarrinho> {
  try {
    const prisma = obterPrisma();
    const sessao = await prisma.session.findUnique({
      where: { token: tokenSessao },
      include: { user: true },
    });
    if (
      !sessao ||
      sessao.expiresAt <= new Date() ||
      sessao.user.status !== "ATIVO" ||
      sessao.user.deletedAt !== null
    )
      return { ok: false, erro: "nao_autenticado", mensagem: "Entre na sua conta para continuar." };
    await prisma.$transaction(async (tx) => {
      const doVisitante = await carrinhoDo(tx, { cookieToken: hashDoToken(tokenVisitante) });
      if (!doVisitante) return;
      const itens = await tx.cartItem.findMany({
        where: { cartId: doVisitante.id },
        include: { artwork: true },
      });
      const daConta =
        (await carrinhoDo(tx, { userId: sessao.userId })) ??
        (await tx.cart.create({ data: { userId: sessao.userId } }));
      for (const item of itens) {
        const chave = { cartId_artworkId: { cartId: daConta.id, artworkId: item.artworkId } };
        const existente = await tx.cartItem.findUnique({ where: chave });
        // Obra que ficou indisponível vem junto (o carrinho a mostra marcada), com ao menos 1.
        const quantidade = quantidadeAoJuntar(
          item.quantity,
          existente?.quantity ?? 0,
          Math.max(item.artwork.stockQuantity, 1),
        );
        await tx.cartItem.upsert({
          where: chave,
          create: { cartId: daConta.id, artworkId: item.artworkId, quantity: quantidade },
          update: { quantity: quantidade },
        });
      }
      await tx.cartItem.deleteMany({ where: { cartId: doVisitante.id } });
      await tx.cart.delete({ where: { id: doVisitante.id } });
      await tx.cart.update({ where: { id: daConta.id }, data: { updatedAt: new Date() } });
    });
    return { ok: true, dados: undefined };
  } catch (erro) {
    console.error(
      "Falha ao juntar carrinhos",
      erro instanceof Error ? erro.name : "erro desconhecido",
    );
    return {
      ok: false,
      erro: "falha",
      mensagem: "Não foi possível juntar o carrinho agora. Tente novamente.",
    };
  }
}
