import { z } from "zod";

export const SENHA_MINIMA = 8;
export const SENHA_MAXIMA = 128;

export const schemaCadastro = z.object({
  nome: z.string().trim().min(2, "Informe seu nome."),
  email: z.string().trim().toLowerCase().pipe(z.email("Informe um e-mail válido.")),
  telefone: z
    .string()
    .transform((valor) => valor.replace(/\D/g, ""))
    .pipe(z.string().regex(/^\d{10,11}$/, "Informe o telefone com DDD.")),
  senha: z
    .string()
    .min(SENHA_MINIMA, `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`)
    .max(SENHA_MAXIMA, `A senha pode ter no máximo ${SENHA_MAXIMA} caracteres.`),
});

export type EntradaCadastro = z.input<typeof schemaCadastro>;
export type DadosCadastro = z.output<typeof schemaCadastro>;
export type CampoCadastro = keyof DadosCadastro;
export type ErrosCadastro = Partial<Record<CampoCadastro, string>>;

export type ResultadoValidacao =
  { ok: true; dados: DadosCadastro } | { ok: false; campos: ErrosCadastro };

export function validarCadastro(entrada: EntradaCadastro): ResultadoValidacao {
  const resultado = schemaCadastro.safeParse(entrada);
  if (resultado.success) {
    return { ok: true, dados: resultado.data };
  }
  const campos: ErrosCadastro = {};
  for (const problema of resultado.error.issues) {
    const campo = problema.path[0] as CampoCadastro;
    campos[campo] ??= problema.message;
  }
  return { ok: false, campos };
}
