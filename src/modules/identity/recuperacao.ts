import { z } from "zod";

import { validarCom, type ErrosDe, type ResultadoValidacaoDe } from "./validacao";

export const schemaPedidoRecuperacao = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Informe um e-mail válido.")),
});

export type EntradaPedidoRecuperacao = z.input<typeof schemaPedidoRecuperacao>;
export type DadosPedidoRecuperacao = z.output<typeof schemaPedidoRecuperacao>;
export type ErrosPedidoRecuperacao = ErrosDe<DadosPedidoRecuperacao>;

// Mesma resposta para e-mail com ou sem conta, e também quando o limite estoura.
export const MENSAGEM_PEDIDO_RECUPERACAO =
  "Se o e-mail estiver cadastrado, enviamos um link para redefinir a senha.";

export function validarPedidoRecuperacao(
  entrada: EntradaPedidoRecuperacao,
): ResultadoValidacaoDe<DadosPedidoRecuperacao> {
  return validarCom(schemaPedidoRecuperacao, entrada);
}
