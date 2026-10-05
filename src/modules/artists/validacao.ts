import { z } from "zod";
import { schemaCadastro } from "../identity";

export const schemaId = z.uuid("Identificador inválido.");
const nome = z
  .string()
  .trim()
  .min(2, "Informe pelo menos 2 caracteres.")
  .max(120, "Use até 120 caracteres.");
const slug = z
  .string()
  .trim()
  .min(2, "Informe um slug.")
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use letras minúsculas, números e hífens no slug.");
const opcional = (maximo: number) =>
  z
    .string()
    .trim()
    .max(maximo)
    .optional()
    .transform((valor) => valor || null);
export const schemaTaxonomia = z.object({ nome, slug, descricao: opcional(2000) });
const perfil = {
  slug,
  bio: opcional(4000),
  avatarUrl: z
    .union([
      z.literal(""),
      z.url().refine((valor) => new URL(valor).protocol === "https:", "Use uma URL HTTPS."),
    ])
    .optional()
    .transform((valor) => valor || null),
  instagram: z
    .string()
    .trim()
    .max(30)
    .regex(/^@?[a-zA-Z0-9._]*$/, "Informe apenas o nome de usuário do Instagram.")
    .optional()
    .transform((valor) => valor?.replace(/^@/, "") || null),
  estilos: z
    .array(schemaId)
    .max(100)
    .refine((valores) => new Set(valores).size === valores.length, "Não repita estilos."),
};
export const schemaNovoArtista = z.discriminatedUnion("modo", [
  z.object({ modo: z.literal("novo"), ...schemaCadastro.shape, nome, ...perfil }),
  z.object({ modo: z.literal("existente"), userId: schemaId, ...perfil }),
]);
export const schemaEditarArtista = z.object({
  id: schemaId,
  nome,
  telefone: schemaCadastro.shape.telefone,
  ...perfil,
});
export type EntradaArtista = z.input<typeof schemaNovoArtista>;
export type EntradaEditarArtista = z.input<typeof schemaEditarArtista>;
export type EntradaTaxonomia = z.input<typeof schemaTaxonomia>;
export type TipoTaxonomia = "estilos" | "tags";
export type ResultadoGestao<T = undefined> =
  | { ok: true; dados: T }
  | { ok: false; erro: string; mensagem: string; campos?: Record<string, string> };
