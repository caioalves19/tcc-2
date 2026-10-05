import { hashPassword } from "better-auth/crypto";
import type { Prisma } from "../../../generated/prisma/client";
import { comoAdmin, ErroGestao, validar } from "./acesso";
import { schemaNovoArtista, schemaEditarArtista, schemaId } from "./validacao";

async function validarEstilos(tx: Prisma.TransactionClient, estilos: string[]) {
  const total = await tx.tattooStyle.count({ where: { id: { in: estilos } } });
  if (total !== estilos.length)
    throw new ErroGestao("invalido", "Um dos estilos não existe. Atualize a página.");
}
export function criarArtista(entrada: unknown, cabecalhos: Headers) {
  return comoAdmin(cabecalhos, async (tx) => {
    const dados = validar(schemaNovoArtista, entrada);
    await validarEstilos(tx, dados.estilos);
    let userId: string;
    if (dados.modo === "novo") {
      const usuario = await tx.user.create({
        data: { name: dados.nome, email: dados.email, phone: dados.telefone, role: "ARTISTA" },
      });
      // Mesmo formato e algoritmo usado pelo Better Auth, sem chamar signUp e abrir sessão.
      await tx.account.create({
        data: {
          userId: usuario.id,
          provider: "credential",
          externalId: usuario.id,
          passwordHash: await hashPassword(dados.senha),
        },
      });
      userId = usuario.id;
    } else {
      const usuario = await tx.user.findUnique({
        where: { id: dados.userId },
        include: { artist: true },
      });
      if (
        !usuario ||
        usuario.status !== "ATIVO" ||
        usuario.deletedAt !== null ||
        usuario.role === "ADMIN"
      )
        throw new ErroGestao("invalido", "Selecione uma conta CLIENTE ou ARTISTA ativa.");
      if (usuario.artist)
        throw new ErroGestao("duplicado", "Esta conta já possui um perfil de artista.");
      await tx.user.update({ where: { id: usuario.id }, data: { role: "ARTISTA" } });
      userId = usuario.id;
    }
    const artista = await tx.artist.create({
      data: {
        userId,
        slug: dados.slug,
        bio: dados.bio,
        avatarUrl: dados.avatarUrl,
        instagram: dados.instagram,
        styles: { create: dados.estilos.map((tattooStyleId) => ({ tattooStyleId })) },
      },
    });
    return { id: artista.id };
  });
}
export function listarArtistas(cabecalhos: Headers) {
  return comoAdmin(cabecalhos, async (tx) => {
    const artistas = await tx.artist.findMany({
      include: { user: true, styles: true },
      orderBy: { user: { name: "asc" } },
    });
    return artistas.map((artista) => ({
      id: artista.id,
      userId: artista.userId,
      nome: artista.user.name,
      email: artista.user.email,
      telefone: artista.user.phone ?? "",
      slug: artista.slug,
      bio: artista.bio,
      avatarUrl: artista.avatarUrl,
      instagram: artista.instagram,
      estilos: artista.styles.map((estilo) => estilo.tattooStyleId),
    }));
  });
}

export function listarContasDisponiveis(cabecalhos: Headers) {
  return comoAdmin(cabecalhos, (tx) =>
    tx.user.findMany({
      where: {
        role: { in: ["CLIENTE", "ARTISTA"] },
        status: "ATIVO",
        deletedAt: null,
        artist: null,
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  );
}

export function editarArtista(entrada: unknown, cabecalhos: Headers) {
  return comoAdmin(cabecalhos, async (tx) => {
    const dados = validar(schemaEditarArtista, entrada);
    await validarEstilos(tx, dados.estilos);
    const artista = await tx.artist.findUnique({ where: { id: dados.id } });
    if (!artista) throw new ErroGestao("nao_encontrado", "Artista não encontrado.");
    await tx.user.update({
      where: { id: artista.userId },
      data: { name: dados.nome, phone: dados.telefone },
    });
    await tx.artist.update({
      where: { id: dados.id },
      data: {
        slug: dados.slug,
        bio: dados.bio,
        avatarUrl: dados.avatarUrl,
        instagram: dados.instagram,
        styles: {
          deleteMany: {},
          create: dados.estilos.map((tattooStyleId) => ({ tattooStyleId })),
        },
      },
    });
  });
}
export function excluirArtista(id: unknown, cabecalhos: Headers) {
  return comoAdmin(cabecalhos, async (tx) => {
    const where = { id: validar(schemaId, id) };
    const artista = await tx.artist.findUnique({
      where,
      include: {
        user: true,
        _count: { select: { artworks: true, portfolioItems: true, appointments: true } },
      },
    });
    if (!artista) throw new ErroGestao("nao_encontrado", "Artista não encontrado.");
    if (Object.values(artista._count).some((total) => total > 0))
      throw new ErroGestao(
        "vinculado",
        "Este artista possui obras, portfólio ou agenda. Remova os vínculos antes de excluir.",
      );
    await tx.artist.delete({ where });
    // Exclui o perfil, preservando a conta e eventual histórico de compras.
    if (artista.user.role === "ARTISTA") {
      await tx.user.update({ where: { id: artista.userId }, data: { role: "CLIENTE" } });
      await tx.session.deleteMany({ where: { userId: artista.userId } });
    }
  });
}
