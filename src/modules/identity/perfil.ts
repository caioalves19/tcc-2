import { schemaCadastro, schemaSenhaNova, SENHA_MAXIMA } from "./cadastro";
import { validarCom, type ErrosDe } from "./validacao";
import { z } from "zod";

export const schemaPerfil = schemaCadastro.pick({ nome: true, telefone: true });
export type EntradaPerfil = z.input<typeof schemaPerfil>;
export type DadosPerfil = z.output<typeof schemaPerfil>;
export type ResultadoEdicao<Dados> =
  | { ok: true }
  | { ok: false; erro: "invalido"; campos: ErrosDe<Dados> }
  | { ok: false; erro: "nao_autenticado" };
export type ResultadoPerfil = ResultadoEdicao<DadosPerfil>;
export function validarPerfil(entrada: EntradaPerfil) {
  return validarCom(schemaPerfil, entrada);
}

export const schemaTrocaSenha = z
  .object({
    senhaAtual: z
      .string()
      .min(1, "Informe sua senha atual.")
      .max(SENHA_MAXIMA, `A senha pode ter no máximo ${SENHA_MAXIMA} caracteres.`),
    senha: schemaSenhaNova,
    confirmacao: z.string(),
  })
  .refine((dados) => dados.senha === dados.confirmacao, {
    message: "As senhas não conferem.",
    path: ["confirmacao"],
  });
export type EntradaTrocaSenha = z.input<typeof schemaTrocaSenha>;
export type DadosTrocaSenha = z.output<typeof schemaTrocaSenha>;
export type ResultadoTrocaSenha =
  ResultadoEdicao<DadosTrocaSenha> | { ok: false; erro: "senha_atual_incorreta" };
export function validarTrocaSenha(entrada: EntradaTrocaSenha) {
  return validarCom(schemaTrocaSenha, entrada);
}
