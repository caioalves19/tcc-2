import { escolherEnviador } from "./email";

type Ambiente = {
  NODE_ENV?: string;
  BETTER_AUTH_URL?: string;
  APP_URL?: string;
  RESEND_API_KEY?: string;
  EMAIL_REMETENTE?: string;
};

// Configuração que, faltando em produção, quebraria algo em silêncio: falha na subida.
export function verificarAmbienteDeProducao(ambiente: Ambiente): void {
  // Sem RESEND_API_KEY em produção, escolherEnviador lança (o link nunca vai para log).
  escolherEnviador(ambiente);
  if (ambiente.NODE_ENV === "production" && !ambiente.BETTER_AUTH_URL?.trim()) {
    throw new Error(
      "BETTER_AUTH_URL ausente em produção: os links dos e-mails apontariam para localhost.",
    );
  }
  // RF13 (PBI-27): fora de https a preferência sai sem notification_url, e nenhum pagamento seria
  // confirmado pelo webhook. O MP_ACCESS_TOKEN não entra aqui: sem ele o app sobe e o pagamento
  // falha de forma tratada.
  if (ambiente.NODE_ENV === "production" && !ambiente.APP_URL?.trim().startsWith("https://")) {
    throw new Error(
      "APP_URL precisa ser https em produção: sem isso o Mercado Pago não notifica os pagamentos.",
    );
  }
}
