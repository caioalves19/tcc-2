import type { Politica } from "@/components/politicas/documento-politica";
import { CONTATO } from "@/lib/contato";

const EMAIL = `[${CONTATO.email}](mailto:${CONTATO.email})`;

// Escopo P0 da v2.2: compra exige conta (RN01), estoque (RN02, RN11), reserva de
// 10 minutos (RN03, RN06), confirmação só pelo gateway (RN05) e pedido de tatuagem
// que só abre o WhatsApp, com os três avisos (RF20, RF23 a RF25).
export const TERMOS: Politica = {
  slug: "termos",
  titulo: "Termos de uso",
  resumo:
    "As regras para usar o site do Kolô: conta, compra de obras, pagamento e pedido de tatuagem.",
  atualizadaEm: "2026-10-05",
  secoes: [
    {
      id: "sobre",
      titulo: "Sobre estes termos",
      blocos: [
        "Este site é do Kolô Ateliê & Estúdio, ateliê de arte urbana e estúdio de tatuagem em São Paulo. Por aqui você conhece e compra obras do acervo, vê o portfólio de tatuagem e começa um pedido de tatuagem, que continua pelo WhatsApp.",
        "Ao usar o site, você concorda com estes termos, com a [Política de privacidade](/politicas/privacidade) e com a [Política de cancelamento](/politicas/cancelamento).",
      ],
    },
    {
      id: "conta",
      titulo: "Sua conta",
      blocos: [
        {
          itens: [
            "Ver o acervo e o portfólio e fazer o pedido de tatuagem não exige conta. Para comprar, é preciso entrar na sua conta.",
            "Use dados verdadeiros no cadastro e mantenha nome e telefone atualizados em [Minha conta](/conta).",
            "A senha é pessoal. Se desconfiar que alguém a conhece, troque em [Minha conta](/conta) ou use a recuperação de senha.",
            "Podemos suspender contas usadas para fraude ou para atacar o site.",
          ],
        },
      ],
    },
    {
      id: "compras",
      titulo: "Compra de obras",
      blocos: [
        {
          itens: [
            "A maioria das obras é peça única. O estoque aparece na página de cada obra, e não vendemos além dele.",
            "Obras esgotadas continuam no acervo, identificadas como esgotadas, mas não podem ser compradas.",
            "Os preços estão em reais. O total do pedido, com o frete, aparece antes do pagamento.",
            "Ao ir para o pagamento, as obras ficam reservadas para você por 10 minutos. Se o pagamento não for aprovado nesse tempo, elas voltam a ficar disponíveis.",
            "Com Pix ou boleto, a reserva vale até o pagamento ser aprovado ou o código vencer.",
            "O pedido só é confirmado quando o Mercado Pago aprova o pagamento.",
            "As fotos mostram as obras com o máximo de fidelidade, mas as cores podem variar um pouco de uma tela para outra.",
          ],
        },
      ],
    },
    {
      id: "pagamento",
      titulo: "Pagamento",
      blocos: [
        "Os pagamentos são processados pelo Mercado Pago, com Pix, cartão ou boleto. Você informa os dados de pagamento no ambiente do Mercado Pago, que tem termos e política de privacidade próprios. O Kolô não recebe os dados do seu cartão.",
      ],
    },
    {
      id: "entrega",
      titulo: "Entrega",
      blocos: [
        "As formas de entrega disponíveis, com os custos, aparecem antes do pagamento. Quando houver envio, o código de rastreio aparece no seu pedido.",
        "Para desistir de uma compra ou relatar um problema com a obra, veja a [Política de cancelamento](/politicas/cancelamento).",
      ],
    },
    {
      id: "tatuagem",
      titulo: "Pedido de tatuagem",
      blocos: [
        "O pedido de tatuagem organiza a sua ideia e abre uma conversa no WhatsApp com o estúdio. Ele não marca horário, não confirma sessão e não cobra nada.",
        "Data, valor e detalhes da sessão são combinados diretamente com o artista, nessa conversa.",
        "Antes de abrir a conversa, você confirma três avisos: a ficha de anamnese é preenchida presencialmente; o termo de consentimento é assinado presencialmente; e é preciso ter 18 anos ou mais, com documento conferido no estúdio.",
      ],
    },
    {
      id: "direitos-autorais",
      titulo: "Obras, fotos e direitos autorais",
      blocos: [
        "As obras, as tatuagens do portfólio, as fotos e os textos do site são dos artistas e do Kolô e estão protegidos pela Lei de Direitos Autorais (Lei 9.610/1998).",
        "Comprar uma obra original dá a você a peça física, não os direitos autorais sobre ela. Para reproduzir a obra, como em estampas ou cópias, é preciso autorização do artista.",
      ],
    },
    {
      id: "uso",
      titulo: "Uso do site",
      blocos: [
        "Não é permitido tentar acessar áreas restritas, burlar as proteções do site, fazer acessos automatizados em massa ou usar o site para fraude.",
        "O site pode sair do ar por alguns momentos, para manutenção ou por falha técnica. Trabalhamos para que isso seja raro e rápido.",
      ],
    },
    {
      id: "mudancas",
      titulo: "Mudanças nestes termos",
      blocos: [
        "Podemos atualizar estes termos. A data da última mudança fica no topo da página, e cada compra segue os termos válidos na data em que foi feita.",
      ],
    },
    {
      id: "lei",
      titulo: "Lei aplicável",
      blocos: [
        "Estes termos seguem as leis brasileiras, incluindo o Código de Defesa do Consumidor. Questões sobre eles podem ser resolvidas no foro do seu domicílio.",
      ],
    },
    {
      id: "contato",
      titulo: "Contato",
      blocos: [
        `Dúvidas sobre estes termos: escreva para ${EMAIL} ou chame no [WhatsApp](${CONTATO.whatsapp}).`,
      ],
    },
  ],
};
