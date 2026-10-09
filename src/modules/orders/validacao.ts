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
