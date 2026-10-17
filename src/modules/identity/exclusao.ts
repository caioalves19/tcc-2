import { z } from "zod";
import { SENHA_MAXIMA } from "./cadastro";
import { validarCom } from "./validacao";

// RN12 (PBI-40): a exclusão da conta pede a senha atual e a confirmação de que não tem volta.
export const schemaExclusaoConta = z.object({
  senha: z
    .string()
    .min(1, "Informe sua senha atual.")
    .max(SENHA_MAXIMA, `A senha pode ter no máximo ${SENHA_MAXIMA} caracteres.`),
  confirmo: z.literal(true, {
    error: "Confirme que entende que a exclusão não pode ser desfeita.",
  }),
});
export type EntradaExclusaoConta = z.input<typeof schemaExclusaoConta>;
export type DadosExclusaoConta = z.output<typeof schemaExclusaoConta>;
export function validarExclusaoConta(entrada: unknown) {
  return validarCom(schemaExclusaoConta, entrada);
}
