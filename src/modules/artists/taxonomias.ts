import { z } from "zod";
import { comoAdmin, validar, ErroGestao } from "./acesso";
import { schemaId, schemaTaxonomia, type TipoTaxonomia } from "./validacao";

const schemaTipo = z.enum(["estilos", "tags"]);
export function criarTaxonomia(tipo: TipoTaxonomia, entrada: unknown, cabecalhos: Headers) {
  return comoAdmin(cabecalhos, async (tx) => {
    validar(schemaTipo, tipo);
    const { nome, slug, descricao } = validar(schemaTaxonomia, entrada);
    const salvo =
      tipo === "estilos"
        ? await tx.tattooStyle.create({ data: { name: nome, slug, description: descricao } })
        : await tx.tag.create({ data: { name: nome, slug } });
    return {
      id: salvo.id,
      nome: salvo.name,
      slug: salvo.slug,
      descricao:
        "description" in salvo && typeof salvo.description === "string" ? salvo.description : null,
    };
  });
}
export function listarTaxonomias(tipo: TipoTaxonomia, cabecalhos: Headers) {
  return comoAdmin(cabecalhos, async (tx) => {
    validar(schemaTipo, tipo);
    const registros =
      tipo === "estilos"
        ? await tx.tattooStyle.findMany({ orderBy: { name: "asc" } })
        : await tx.tag.findMany({ orderBy: { name: "asc" } });
    return registros.map((registro) => ({
      id: registro.id,
      nome: registro.name,
      slug: registro.slug,
      descricao:
        "description" in registro && typeof registro.description === "string"
          ? registro.description
          : null,
    }));
  });
}

export function editarTaxonomia(
  tipo: TipoTaxonomia,
  id: unknown,
  entrada: unknown,
  cabecalhos: Headers,
) {
  return comoAdmin(cabecalhos, async (tx) => {
    validar(schemaTipo, tipo);
    const where = { id: validar(schemaId, id) };
    const { nome, slug, descricao } = validar(schemaTaxonomia, entrada);
    if (tipo === "estilos")
      await tx.tattooStyle.update({ where, data: { name: nome, slug, description: descricao } });
    else await tx.tag.update({ where, data: { name: nome, slug } });
  });
}
export function excluirTaxonomia(tipo: TipoTaxonomia, id: unknown, cabecalhos: Headers) {
  return comoAdmin(cabecalhos, async (tx) => {
    validar(schemaTipo, tipo);
    const where = { id: validar(schemaId, id) };
    if (tipo === "estilos") {
      const estilo = await tx.tattooStyle.findUnique({
        where,
        include: {
          _count: { select: { artists: true, portfolioItems: true, appointments: true } },
        },
      });
      if (!estilo) throw new ErroGestao("nao_encontrado", "Estilo não encontrado.");
      if (Object.values(estilo._count).some((total) => total > 0))
        throw new ErroGestao(
          "vinculado",
          "Este estilo está associado a artistas, portfólio ou agenda. Remova os vínculos antes de excluir.",
        );
      await tx.tattooStyle.delete({ where });
    } else {
      const tag = await tx.tag.findUnique({
        where,
        include: { _count: { select: { artworks: true } } },
      });
      if (!tag) throw new ErroGestao("nao_encontrado", "Tag não encontrada.");
      if (tag._count.artworks > 0)
        throw new ErroGestao(
          "vinculado",
          "Esta tag está associada a obras. Remova os vínculos antes de excluir.",
        );
      await tx.tag.delete({ where });
    }
  });
}
