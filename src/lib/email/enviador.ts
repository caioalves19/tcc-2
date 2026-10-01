import { Resend } from "resend";

export type MensagemEmail = { para: string; assunto: string; html: string; texto: string };

export type EnviadorEmail = {
  provedor: string;
  enviar(mensagem: MensagemEmail): Promise<{ idExterno?: string }>;
};

type AmbienteEmail = {
  NODE_ENV?: string;
  RESEND_API_KEY?: string;
  EMAIL_REMETENTE?: string;
};

// Remetente do sandbox do Resend: só entrega para o e-mail dono da conta.
const REMETENTE_SANDBOX = "Kolô <onboarding@resend.dev>";

function enviadorResend(chave: string, remetente: string): EnviadorEmail {
  const resend = new Resend(chave);
  return {
    provedor: "resend",
    async enviar(mensagem) {
      const { data, error } = await resend.emails.send({
        from: remetente,
        to: mensagem.para,
        subject: mensagem.assunto,
        html: mensagem.html,
        text: mensagem.texto,
      });
      if (error !== null) {
        throw new Error(`Resend recusou o envio: ${error.name}: ${error.message}`);
      }
      return { idExterno: data.id };
    },
  };
}

// Só fora de produção: o e-mail (com o link) vai para o terminal de quem desenvolve.
const enviadorConsole: EnviadorEmail = {
  provedor: "console",
  async enviar(mensagem) {
    console.info(`[e-mail] Para: ${mensagem.para} · ${mensagem.assunto}\n${mensagem.texto}`);
    return {};
  },
};

export function escolherEnviador(ambiente: AmbienteEmail): EnviadorEmail {
  const chave = ambiente.RESEND_API_KEY?.trim();
  if (chave) {
    return enviadorResend(chave, ambiente.EMAIL_REMETENTE?.trim() || REMETENTE_SANDBOX);
  }
  if (ambiente.NODE_ENV === "production") {
    throw new Error(
      "RESEND_API_KEY ausente em produção: o e-mail de recuperação de senha precisa do Resend.",
    );
  }
  return enviadorConsole;
}
