import { z } from "zod";

export const id = z.uuid("Identificador inválido.").transform((valor) => valor.toLowerCase());
const opcional = (maximo: number) =>
  z
    .string()
    .trim()
    .max(maximo)
    .optional()
    .transform((valor) => valor || null);
export const ficha = z.object({
  artistaId: id,
  titulo: z.string().trim().min(3, "Informe um título com pelo menos 3 caracteres.").max(200),
  descricao: opcional(2000),
  regiaoCorpo: opcional(80),
  estilos: z
    .array(id)
    .max(50)
    .default([])
    .transform((valores) => [...new Set(valores)]),
  destaque: z.boolean().default(false),
});
export const criacao = ficha.extend({ chave: z.string().max(300) });
