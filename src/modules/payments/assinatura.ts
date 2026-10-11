import { InvalidWebhookSignatureError, WebhookSignatureValidator } from "mercadopago";

export type DadosAssinatura = {
  assinatura: string | null;
  idRequisicao: string | null;
  idDado: string | null;
  segredo: string;
};

// RNF11: só processa a notificação que o Mercado Pago assinou (HMAC-SHA256 de id, request-id e
// ts com o segredo do webhook). O validador oficial do SDK compara em tempo constante.
export function assinaturaValida(dados: DadosAssinatura): boolean {
  try {
    WebhookSignatureValidator.validate({
      xSignature: dados.assinatura,
      xRequestId: dados.idRequisicao,
      dataId: dados.idDado,
      secret: dados.segredo,
    });
    return true;
  } catch (erro) {
    // O motivo e o x-request-id localizam o aviso no painel do Mercado Pago; nunca o segredo.
    console.warn(
      "Assinatura do webhook recusada",
      erro instanceof InvalidWebhookSignatureError ? erro.reason : "erro desconhecido",
      dados.idRequisicao,
    );
    return false;
  }
}
