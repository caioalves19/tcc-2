"use server";

import { headers } from "next/headers";
import { obterPool } from "@/lib/db";
import { ipDaRequisicao } from "@/lib/requisicao";
import { consumirTentativa, type RegraLimite } from "@/lib/rate-limit";
import { validarContato, type EntradaContato, type ErrosContato } from "./validacao";
import { verificarTurnstile } from "./turnstile";

// Limite: 3 mensagens a cada 15 minutos por IP
const REGRA_LIMITE: RegraLimite = { maximo: 3, janelaMs: 15 * 60 * 1000 };

export type ResultadoContato =
  | { ok: true }
  | { ok: false; mensagem: string }
  | { ok: false; campos: ErrosContato };

export async function enviarContato(entrada: EntradaContato): Promise<ResultadoContato> {
  const ip = ipDaRequisicao(headers());

  const limite = await consumirTentativa(`contato:${ip}`, REGRA_LIMITE);
  if (limite.bloqueado) {
    return { ok: false, mensagem: "Muitas tentativas. Tente novamente mais tarde." };
  }

  const validacao = validarContato(entrada);
  if (!validacao.ok) {
    return { ok: false, campos: validacao.campos };
  }

  const { nome, email, mensagem, tokenTurnstile } = validacao.dados;

  const passouTurnstile = await verificarTurnstile({ token: tokenTurnstile, ip });
  if (!passouTurnstile) {
    return { ok: false, mensagem: "Falha na verificação de segurança." };
  }

  await obterPool().query(
    "INSERT INTO contact_message (id, nome, email, mensagem) VALUES (gen_random_uuid(), $1, $2, $3)",
    [nome, email, mensagem]
  );

  return { ok: true };
}
