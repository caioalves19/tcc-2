import type { Politica } from "@/components/politicas/documento-politica";
import { CONTATO } from "@/lib/contato";

const EMAIL = `[${CONTATO.email}](mailto:${CONTATO.email})`;
const WHATSAPP = `[WhatsApp](${CONTATO.whatsapp})`;

// Informativa: na v2.2 o software não aplica política de cancelamento (seção 14 do
// ESCOPO). Pedido não pago segue RN03 e RN06; a desistência segue o CDC (art. 49).
// A sessão de tatuagem não passa pelo site, então as regras dela ficam com o artista.
export const CANCELAMENTO: Politica = {
  slug: "cancelamento",
  titulo: "Política de cancelamento",
  resumo: "Como desistir de uma compra, pedir reembolso e mudar uma sessão de tatuagem.",
  atualizadaEm: "2026-10-05",
  secoes: [
    {
      id: "nao-pago",
      titulo: "Pedido ainda não pago",
      blocos: [
        "Enquanto o pagamento não é aprovado, nada é cobrado. A reserva das obras dura 10 minutos ou, com Pix e boleto, até o código vencer. Se o pagamento não for aprovado nesse prazo, o pedido não segue e as obras voltam a ficar disponíveis.",
        "Para desistir antes de pagar, basta não concluir o pagamento.",
      ],
    },
    {
      id: "arrependimento",
      titulo: "Desistir da compra em até 7 dias",
      blocos: [
        "Pelo Código de Defesa do Consumidor (art. 49), você pode desistir de uma compra feita pelo site em até 7 dias corridos, contados do dia em que recebeu ou retirou a obra. Não precisa explicar o motivo.",
        {
          itens: [
            `Avise dentro do prazo pelo e-mail ${EMAIL} ou pelo ${WHATSAPP}, com o número do pedido.`,
            "Combinamos com você como devolver a obra, sem custo para você. Devolva a obra como a recebeu, de preferência na embalagem original.",
            "Devolvemos o valor total pago, incluindo o frete, pelo mesmo meio de pagamento, por meio do Mercado Pago.",
          ],
        },
        "No cartão, o estorno aparece na fatura conforme o prazo da operadora. No Pix, o valor volta para a conta de origem. No boleto, o reembolso segue as regras do Mercado Pago.",
      ],
    },
    {
      id: "defeito",
      titulo: "Obra com defeito ou danificada",
      blocos: [
        "Se a obra chegar danificada ou com defeito, avise com fotos. Pelo Código de Defesa do Consumidor, você tem até 90 dias para reclamar.",
        "Como a maioria das obras é peça única, nem sempre existe outra igual para trocar. Se não for possível consertar, devolvemos o valor pago.",
      ],
    },
    {
      id: "kolo-cancela",
      titulo: "Quando o Kolô cancela",
      blocos: [
        "Se não conseguirmos entregar uma obra paga, por exemplo porque ela foi danificada antes do envio, avisamos você e devolvemos o valor total.",
      ],
    },
    {
      id: "tatuagem",
      titulo: "Sessões de tatuagem",
      blocos: [
        "O pedido de tatuagem pelo site não marca horário nem cobra nada: ele só abre a conversa no WhatsApp.",
        `Remarcação, atraso, cancelamento e qualquer valor pago antes da sessão são combinados diretamente com o artista. Se precisar mudar algo, avise o estúdio pelo ${WHATSAPP} o quanto antes.`,
      ],
    },
    {
      id: "como-pedir",
      titulo: "Como pedir",
      blocos: [
        `Para cancelar, devolver ou pedir reembolso, escreva para ${EMAIL} ou chame no ${WHATSAPP}. Informe o número do pedido para agilizar.`,
      ],
    },
  ],
};
