import { z } from "zod";

import { schemaSenhaNova } from "./cadastro";
import { validarCom, type ErrosDe, type ResultadoValidacaoDe } from "./validacao";

export const schemaPedidoRecuperacao = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Informe um e-mail válido.")),
});

export type EntradaPedidoRecuperacao = z.input<typeof schemaPedidoRecuperacao>;
export type DadosPedidoRecuperacao = z.output<typeof schemaPedidoRecuperacao>;
export type ErrosPedidoRecuperacao = ErrosDe<DadosPedidoRecuperacao>;

export type ResultadoPedidoRecuperacao =
  { ok: true } | { ok: false; erro: "invalido"; campos: ErrosPedidoRecuperacao };

// Mesma resposta para e-mail com ou sem conta, e também quando o limite estoura.
export const MENSAGEM_PEDIDO_RECUPERACAO =
  "Se o e-mail estiver cadastrado, enviamos um link para redefinir a senha.";

export function validarPedidoRecuperacao(
  entrada: EntradaPedidoRecuperacao,
): ResultadoValidacaoDe<DadosPedidoRecuperacao> {
  return validarCom(schemaPedidoRecuperacao, entrada);
}

export const schemaRedefinicao = z
  .object({ senha: schemaSenhaNova, confirmacao: z.string() })
  .refine((dados) => dados.senha === dados.confirmacao, {
    message: "As senhas não conferem.",
    path: ["confirmacao"],
  });

export type EntradaRedefinicao = z.input<typeof schemaRedefinicao>;
export type DadosRedefinicao = z.output<typeof schemaRedefinicao>;
export type ErrosRedefinicao = ErrosDe<DadosRedefinicao>;

export type FalhaRedefinicao =
  { ok: false; erro: "token_invalido" } | { ok: false; erro: "invalido"; campos: ErrosRedefinicao };

export const MENSAGEM_TOKEN_INVALIDO = "Link inválido ou expirado. Peça um novo.";

// Sem token na URL: a página tira o token da barra ao abrir, então recarregar cai aqui
// mesmo com o link do e-mail ainda valendo.
export const MENSAGEM_SEM_TOKEN = "Abra de novo o link que enviamos por e-mail ou peça um novo.";

export function validarRedefinicao(
  entrada: EntradaRedefinicao,
): ResultadoValidacaoDe<DadosRedefinicao> {
  return validarCom(schemaRedefinicao, entrada);
}
