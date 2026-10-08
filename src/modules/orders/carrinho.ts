import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import type { Prisma } from "../../../generated/prisma/client";
import { sessaoDaRequisicao } from "../../lib/auth";
import { obterPrisma } from "../../lib/prisma";
import { chaveMiniatura } from "../media/index";
import { obraDisponivel, quantidadeValida, resumirCarrinho } from "./regras";

// Quem é o dono do carrinho: a sessão (conta) ou o token do cookie do visitante.
export type ContextoCarrinho = { cabecalhos: Headers; tokenVisitante: string | null };
export type ResultadoCarrinho<T = undefined> =
  { ok: true; dados: T } | { ok: false; erro: string; mensagem: string };

class ErroCarrinho extends Error {
  constructor(
    public codigo: string,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

const schemaId = z.uuid("Obra inválida.");
const schemaQuantidade = z
  .number()
  .int("Escolha uma quantidade inteira.")
  .min(1, "Escolha pelo menos 1 unidade.")
  .max(999);
const schemaAdicionar = z.object({ obraId: schemaId, quantidade: schemaQuantidade.default(1) });
const schemaAlterar = z.object({ obraId: schemaId, quantidade: schemaQuantidade });

function validar<T>(schema: z.ZodType<T>, entrada: unknown): T {
  const resultado = schema.safeParse(entrada);
  if (!resultado.success)
    throw new ErroCarrinho("invalido", resultado.error.issues.map((i) => i.message).join(" "));
  return resultado.data;
}

async function executar<T>(acao: () => Promise<T>): Promise<ResultadoCarrinho<T>> {
  try {
    return { ok: true, dados: await acao() };
  } catch (erro) {
    if (erro instanceof ErroCarrinho)
      return { ok: false, erro: erro.codigo, mensagem: erro.message };
    console.error("Falha no carrinho", erro instanceof Error ? erro.name : "erro desconhecido");
    return {
      ok: false,
      erro: "falha",
      mensagem: "Não foi possível atualizar o carrinho agora. Tente novamente.",
    };
  }
}

// O cookie leva o token; o banco guarda só o hash, como o rate limit do login.
export function hashDoToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// A sessão diz quem pede; a situação da conta é relida no banco.
export async function usuarioDaSessao(cabecalhos: Headers): Promise<string | null> {
  return (await sessaoAtiva(cabecalhos))?.userId ?? null;
}

// O checkout precisa também do id da sessão, a quem a reserva pertence (PBI-25).
export async function sessaoAtiva(
  cabecalhos: Headers,
): Promise<{ userId: string; sessaoId: string } | null> {
  const sessao = await sessaoDaRequisicao(cabecalhos);
  if (!sessao) return null;
  const atual = await obterPrisma().session.findUnique({
    where: { token: sessao.token },
    include: { user: true },
  });
  if (
    !atual ||
    atual.expiresAt <= new Date() ||
    atual.user.status !== "ATIVO" ||
    atual.user.deletedAt !== null
  )
    return null;
  return { userId: atual.userId, sessaoId: atual.id };
}

type Dono = { userId: string } | { cookieToken: string };

async function donoDoContexto(contexto: ContextoCarrinho): Promise<Dono | null> {
  const userId = await usuarioDaSessao(contexto.cabecalhos);
  if (userId) return { userId };
  return contexto.tokenVisitante ? { cookieToken: hashDoToken(contexto.tokenVisitante) } : null;
}

export function carrinhoDo(tx: Prisma.TransactionClient, dono: Dono) {
  return "userId" in dono
    ? tx.cart.findFirst({ where: { userId: dono.userId }, orderBy: { updatedAt: "desc" } })
    : tx.cart.findUnique({ where: { cookieToken: dono.cookieToken } });
}

function disponivel(obra: {
  status: "RASCUNHO" | "DISPONIVEL" | "ESGOTADA";
  deletedAt: Date | null;
  stockQuantity: number;
}) {
  return obraDisponivel({
    situacao: obra.status,
    arquivada: obra.deletedAt !== null,
    estoque: obra.stockQuantity,
  });
}

// RF11: o carrinho não reserva estoque; só confere que a quantidade cabe no estoque atual.
export function adicionarAoCarrinho(entrada: unknown, contexto: ContextoCarrinho) {
  return executar(async () => {
    const { obraId, quantidade } = validar(schemaAdicionar, entrada);
    const dono = await donoDoContexto(contexto);
    return obterPrisma().$transaction(async (tx) => {
      const obra = await tx.artwork.findUnique({ where: { id: obraId } });
      if (!obra || !disponivel(obra))
        throw new ErroCarrinho("indisponivel", "Esta obra não está disponível para compra.");
      let tokenNovo: string | null = null;
      let carrinho = dono ? await carrinhoDo(tx, dono) : null;
      if (!carrinho) {
        if (dono && "userId" in dono)
          carrinho = await tx.cart.create({ data: { userId: dono.userId } });
        else {
          // Visitante sem carrinho (ou com cookie de um carrinho que não existe mais).
          tokenNovo = randomBytes(32).toString("base64url");
          carrinho = await tx.cart.create({ data: { cookieToken: hashDoToken(tokenNovo) } });
        }
      }
      const chave = { cartId_artworkId: { cartId: carrinho.id, artworkId: obraId } };
      const existente = await tx.cartItem.findUnique({ where: chave });
      const total = (existente?.quantity ?? 0) + quantidade;
      if (!quantidadeValida(total, obra.stockQuantity))
        throw new ErroCarrinho(
          "quantidade_invalida",
          existente
            ? "Você já tem no carrinho todas as unidades disponíveis desta obra."
            : `Só há ${obra.stockQuantity} ${obra.stockQuantity === 1 ? "unidade" : "unidades"} desta obra.`,
        );
      await tx.cartItem.upsert({
        where: chave,
        create: { cartId: carrinho.id, artworkId: obraId, quantity: total },
        update: { quantity: total },
      });
      await tx.cart.update({ where: { id: carrinho.id }, data: { updatedAt: new Date() } });
      return { tokenNovo };
    });
  });
}

export function alterarQuantidade(entrada: unknown, contexto: ContextoCarrinho) {
  return executar(async () => {
    const { obraId, quantidade } = validar(schemaAlterar, entrada);
    const dono = await donoDoContexto(contexto);
    await obterPrisma().$transaction(async (tx) => {
      const carrinho = dono ? await carrinhoDo(tx, dono) : null;
      const chave = { cartId_artworkId: { cartId: carrinho?.id ?? "", artworkId: obraId } };
      const item = carrinho
        ? await tx.cartItem.findUnique({ where: chave, include: { artwork: true } })
        : null;
      if (!item) throw new ErroCarrinho("nao_encontrado", "Esta obra não está no seu carrinho.");
      if (!disponivel(item.artwork))
        throw new ErroCarrinho(
          "indisponivel",
          "Esta obra não está mais disponível. Remova-a do carrinho.",
        );
      if (!quantidadeValida(quantidade, item.artwork.stockQuantity))
        throw new ErroCarrinho(
          "quantidade_invalida",
          `Escolha de 1 a ${item.artwork.stockQuantity} unidades.`,
        );
      await tx.cartItem.update({ where: { id: item.id }, data: { quantity: quantidade } });
      await tx.cart.update({ where: { id: item.cartId }, data: { updatedAt: new Date() } });
    });
  });
}

export function removerDoCarrinho(obraId: unknown, contexto: ContextoCarrinho) {
  return executar(async () => {
    const id = validar(schemaId, obraId);
    const dono = await donoDoContexto(contexto);
    await obterPrisma().$transaction(async (tx) => {
      const carrinho = dono ? await carrinhoDo(tx, dono) : null;
      if (carrinho) await tx.cartItem.deleteMany({ where: { cartId: carrinho.id, artworkId: id } });
    });
  });
}

// Preço, disponibilidade e total vêm sempre do banco, nunca do navegador.
export function lerCarrinho(contexto: ContextoCarrinho) {
  return executar(async () => {
    const dono = await donoDoContexto(contexto);
    const carrinho = dono ? await carrinhoDo(obterPrisma(), dono) : null;
    const itens = carrinho
      ? await obterPrisma().cartItem.findMany({
          where: { cartId: carrinho.id },
          include: {
            artwork: {
              include: {
                artist: { include: { user: true } },
                images: { where: { primary: true }, take: 1 },
              },
            },
          },
          orderBy: { addedAt: "asc" },
        })
      : [];
    const linhas = itens.map(({ artwork: obra, quantity }) => {
      const principal = obra.images[0];
      return {
        obraId: obra.id,
        titulo: obra.title,
        slug: obra.slug,
        artistaNome: obra.artist.user.name,
        precoCentavos: obra.priceCents,
        quantidade: quantity,
        estoque: obra.stockQuantity,
        disponivel: disponivel(obra),
        chaveMiniatura: principal ? chaveMiniatura(principal.url) : null,
        textoAlternativo: principal?.altText ?? obra.title,
      };
    });
    return { itens: linhas, ...resumirCarrinho(linhas) };
  });
}
