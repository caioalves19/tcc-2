import { z } from "zod";

// Entradas do admin de pedidos (PBI-30), validadas no servidor antes de qualquer consulta.

const schemaNumero = z.string().min(1, "Pedido inválido.").max(32, "Pedido inválido.");

// RF29: letras, números e hífen, de 4 a 40 caracteres, em maiúsculas (cada transportadora tem um
// formato, então não fixamos o dos Correios). Vazio limpa o código.
export const schemaRastreio = z.object({
  numero: schemaNumero,
  codigo: z
    .string()
    .trim()
    .transform((codigo) => codigo.toUpperCase())
    .pipe(
      z.union([
        z.literal(""),
        z
          .string()
          .regex(/^[A-Z0-9-]{4,40}$/, "Use de 4 a 40 letras, números ou hífen, sem espaços."),
      ]),
    )
    .transform((codigo) => (codigo === "" ? null : codigo)),
});

// RF29: filtros da lista do admin. "A fazer" (pagos e em preparação) é o padrão.
export const FILTROS_PEDIDOS = [
  "a-fazer",
  "pendentes",
  "enviados",
  "entregues",
  "cancelados",
  "todos",
] as const;
export type FiltroPedidos = (typeof FILTROS_PEDIDOS)[number];
export const PEDIDOS_POR_PAGINA = 20;

// Vem da URL (?filtro=...&busca=...&pagina=...): qualquer valor fora do esperado volta ao padrão.
export const schemaListaAdmin = z.object({
  filtro: z.enum(FILTROS_PEDIDOS).catch("a-fazer"),
  busca: z.string().trim().max(100).catch(""),
  pagina: z.coerce.number().int().min(1).max(1_000_000).catch(1),
});
