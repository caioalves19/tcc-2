import type { z } from "zod";

export type ErrosDe<Dados> = Partial<Record<keyof Dados & string, string>>;

export type ResultadoValidacaoDe<Dados> =
  { ok: true; dados: Dados } | { ok: false; campos: ErrosDe<Dados> };

// Valida com o schema e devolve a primeira mensagem de cada campo, no formato dos formulários.
export function validarCom<Schema extends z.ZodType<object>>(
  schema: Schema,
  entrada: unknown,
): ResultadoValidacaoDe<z.output<Schema>> {
  const resultado = schema.safeParse(entrada);
  if (resultado.success) {
    return { ok: true, dados: resultado.data };
  }
  const campos: ErrosDe<z.output<Schema>> = {};
  for (const problema of resultado.error.issues) {
    const campo = String(problema.path[0]) as keyof z.output<Schema> & string;
    campos[campo] ??= problema.message;
  }
  return { ok: false, campos };
}
