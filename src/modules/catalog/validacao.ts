import { z } from "zod";
import { precoEmCentavos } from "./regras";

export const schemaId = z.uuid("Identificador inválido.");
const slug = z
  .string()
  .trim()
  .min(2, "Informe um slug.")
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use letras minúsculas, números e hífens no slug.");
const opcional = (maximo: number) =>
  z
    .string()
    .trim()
    .max(maximo, `Use até ${maximo} caracteres.`)
    .optional()
    .transform((valor) => valor || null);
// Campos numéricos chegam do formulário como texto; vazio vale como "não informado".
const ano = z
  .union([
    z.literal(""),
    z.coerce
      .number()
      .int("Informe o ano com 4 dígitos.")
      .min(1900, "Informe um ano a partir de 1900.")
      .refine((valor) => valor <= new Date().getFullYear(), "O ano não pode estar no futuro."),
  ])
  .optional()
  .transform((valor) => (valor === "" || valor === undefined ? null : valor));
// RN02: estoque padrão 1, editável de 0 a 999.
const estoque = z
  .union([
    z.literal(""),
    z.coerce
      .number()
      .int("Informe o estoque como número inteiro.")
      .min(0, "O estoque não pode ser negativo.")
      .max(999, "Use um estoque de até 999 unidades."),
  ])
  .optional()
  .transform((valor) => (valor === "" || valor === undefined ? 1 : valor));
// RN07: de R$ 1,00 a R$ 1.000.000,00, guardado em centavos.
const preco = z
  .string()
  .transform((texto, contexto) => {
    const centavos = precoEmCentavos(texto);
    if (centavos === null) {
      contexto.addIssue({ code: "custom", message: "Informe o preço em reais, como 1.234,56." });
      return z.NEVER;
    }
    return centavos;
  })
  .pipe(
    z
      .number()
      .min(100, "O preço mínimo é R$ 1,00.")
      .max(100_000_000, "O preço máximo é R$ 1.000.000,00."),
  );

const ficha = {
  titulo: z
    .string()
    .trim()
    .min(2, "Informe pelo menos 2 caracteres.")
    .max(160, "Use até 160 caracteres."),
  slug,
  descricao: opcional(4000),
  artistaId: schemaId,
  tecnica: opcional(120),
  dimensoes: opcional(120),
  ano,
  preco,
  estoque,
  destaque: z.boolean().default(false),
  tags: z
    .array(schemaId)
    .max(30, "Use até 30 tags.")
    .refine((valores) => new Set(valores).size === valores.length, "Não repita tags.")
    .default([]),
};
// O formulário fala em "preco" (texto em reais); o domínio guarda "precoCentavos".
function emCentavos<T extends { preco: number }>({ preco, ...resto }: T) {
  return { ...resto, precoCentavos: preco };
}

export const schemaObra = z.object(ficha).transform(emCentavos);
// Na edição o admin escolhe rascunho ou publicada; disponível/esgotada vem do estoque (RN11).
export const schemaEditarObra = z
  .object({ ...ficha, id: schemaId, publicada: z.boolean() })
  .transform(emCentavos);

export type EntradaObra = z.input<typeof schemaObra>;
export type EntradaEditarObra = z.input<typeof schemaEditarObra>;
