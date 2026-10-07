const URL_VERIFICACAO = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type PedidoTurnstile = { token: string; ip: string };

export type VerificadorTurnstile = (pedido: PedidoTurnstile) => Promise<boolean>;

export const verificarTurnstile: VerificadorTurnstile = async ({ token, ip }) => {
  const segredo = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!segredo) {
    return false;
  }
  try {
    const corpo = new URLSearchParams({
      secret: segredo,
      response: token,
      remoteip: ip,
    });
    const resposta = await fetch(URL_VERIFICACAO, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: corpo,
    });
    if (!resposta.ok) {
      return false;
    }
    const resultado: unknown = await resposta.json();
    return (
      typeof resultado === "object" &&
      resultado !== null &&
      "success" in resultado &&
      resultado.success === true
    );
  } catch {
    return false;
  }
};
