import { z } from "zod";

// Entradas do admin de clientes (PBI-38), validadas no servidor antes de qualquer consulta.

export const CLIENTES_POR_PAGINA = 20;

// O id do perfil vem da URL (/admin/clientes/[id]).
export const schemaIdCliente = z.uuid();

// Vem da URL (?busca=...&pagina=...): qualquer valor fora do esperado volta ao padrão.
export const schemaListaClientes = z.object({
  busca: z.string().trim().max(100).catch(""),
  pagina: z.coerce.number().int().min(1).max(1_000_000).catch(1),
});
