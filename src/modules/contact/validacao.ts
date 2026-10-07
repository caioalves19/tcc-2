import { z } from "zod";

export const schemaContato = z
  .object({
    nome: z.string().trim().min(2, "Informe seu nome (mínimo de 2 caracteres).").max(100),
    email: z.string().trim().toLowerCase().pipe(z.email("Informe um e-mail válido.")),
    mensagem: z
      .string()
      .trim()
      .min(10, "Escreva uma mensagem (mínimo de 10 caracteres).")
      .max(2000, "A mensagem pode ter no máximo 2000 caracteres."),
    tokenTurnstile: z.string().trim().min(1, "Confirme que você não é um robô."),
  })
  .strict();

export type EntradaContato = z.input<typeof schemaContato>;
export type DadosContato = z.output<typeof schemaContato>;
export type CampoContato = keyof DadosContato;
export type ErrosContato = Partial<Record<CampoContato, string>>;
export type ResultadoValidacaoContato =
  { ok: true; dados: DadosContato } | { ok: false; campos: ErrosContato };

export function validarContato(entrada: unknown): ResultadoValidacaoContato {
  const resultado = schemaContato.safeParse(entrada);
  if (resultado.success) {
    return { ok: true, dados: resultado.data };
  }
  const campos: ErrosContato = {};
  for (const problema of resultado.error.issues) {
    const campo = String(problema.path[0]) as CampoContato;
    campos[campo] ??= problema.message;
  }
  return { ok: false, campos };
}
