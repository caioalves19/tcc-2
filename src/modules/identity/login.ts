import { z } from "zod";

import { validarCom } from "./validacao";

import { SENHA_MAXIMA } from "./cadastro";

export const schemaLogin = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Informe um e-mail válido.")),
  senha: z.string().min(1, "Informe sua senha.").max(SENHA_MAXIMA, "Senha inválida."),
});

export type EntradaLogin = z.input<typeof schemaLogin>;
export type DadosLogin = z.output<typeof schemaLogin>;
export type CampoLogin = keyof DadosLogin;
export type ErrosLogin = Partial<Record<CampoLogin, string>>;

export type ResultadoValidacaoLogin =
  { ok: true; dados: DadosLogin } | { ok: false; campos: ErrosLogin };

// Mensagem única para e-mail inexistente e senha errada: não revela se a conta existe.
export type FalhaLogin =
  { ok: false; erro: "credenciais_invalidas" } | { ok: false; erro: "bloqueado"; minutos: number };

export function mensagemFalhaLogin(falha: FalhaLogin): string {
  if (falha.erro === "bloqueado") {
    return `Muitas tentativas. Tente de novo em ${falha.minutos} min.`;
  }
  return "E-mail ou senha inválidos.";
}

export function validarLogin(entrada: EntradaLogin): ResultadoValidacaoLogin {
  return validarCom(schemaLogin, entrada);
}
