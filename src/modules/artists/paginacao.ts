import { z } from "zod";

export const ITENS_POR_PAGINA = 20;

// Vem da URL (?pagina=...): qualquer valor fora do esperado volta à primeira página.
const schemaEntrada = z.object({
  pagina: z.coerce.number().int().min(1).max(1_000_000).catch(1),
});

export function lerPagina(entrada: unknown): number {
  return schemaEntrada.parse(typeof entrada === "object" && entrada !== null ? entrada : {}).pagina;
}

export function totalDePaginas(total: number): number {
  return Math.ceil(total / ITENS_POR_PAGINA);
}
