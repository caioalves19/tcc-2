import { expect, it } from "vitest";
import { schemaTaxonomia, schemaNovoArtista } from "../../src/modules/artists/validacao";

it("RF28 valida nomes, slugs e conta do artista antes de persistir", () => {
  expect(schemaTaxonomia.parse({ nome: " Aquarela ", slug: "aquarela", descricao: " " })).toEqual({
    nome: "Aquarela",
    slug: "aquarela",
    descricao: null,
  });
  expect(schemaTaxonomia.safeParse({ nome: "", slug: "Slug Inválido" }).success).toBe(false);
  expect(
    schemaNovoArtista.safeParse({
      modo: "novo",
      slug: "ana",
      estilos: [],
      nome: "Ana",
      email: "invalido",
      telefone: "123",
      senha: "curta",
    }).success,
  ).toBe(false);
  expect(
    schemaNovoArtista.parse({
      modo: "novo",
      slug: "ana",
      estilos: [],
      nome: " Ana ",
      email: "ANA@KOLO.TEST",
      telefone: "(11) 98765-4321",
      senha: "senha-inicial-123",
      bio: "",
      avatarUrl: "",
      instagram: "",
    }),
  ).toMatchObject({
    nome: "Ana",
    email: "ana@kolo.test",
    telefone: "11987654321",
    bio: null,
    avatarUrl: null,
    instagram: null,
  });
});

it("RF28 rejeita URLs inseguras, estilos repetidos e dados inesperados", () => {
  const entrada = {
    modo: "existente",
    userId: "00000000-0000-4000-8000-000000000002",
    slug: "artista",
    estilos: [],
  };
  expect(
    schemaNovoArtista.safeParse({ ...entrada, avatarUrl: "javascript:alert(1)" }).success,
  ).toBe(false);
  expect(
    schemaNovoArtista.safeParse({ ...entrada, estilos: [entrada.userId, entrada.userId] }).success,
  ).toBe(false);
  expect(schemaNovoArtista.safeParse(null).success).toBe(false);
  expect(schemaNovoArtista.parse({ ...entrada, role: "ADMIN" })).not.toHaveProperty("role");
});
