import type { Politica } from "@/components/politicas/documento-politica";
import { CONTATO } from "@/lib/contato";

const EMAIL = `[${CONTATO.email}](mailto:${CONTATO.email})`;

// RNF17: cada item de "Quais dados usamos" vem de uma tabela do prisma/schema.prisma.
// Escopo P0 da v2.2 mais o contato (PBI-44, integrado em 07/10). Excluir a conta pelo site
// (PBI-40) só entra aqui quando for integrado; até lá, a exclusão é pedida por e-mail.
export const PRIVACIDADE: Politica = {
  slug: "privacidade",
  titulo: "Política de privacidade",
  resumo:
    "Quais dados o site do Kolô usa, para quê e como você controla os seus. A regra é pedir só o necessário.",
  atualizadaEm: "2026-10-08",
  secoes: [
    {
      id: "quem-cuida",
      titulo: "Quem cuida dos seus dados",
      blocos: [
        "O Kolô Ateliê & Estúdio, ateliê de arte urbana e estúdio de tatuagem em São Paulo, é o responsável pelos dados tratados neste site, como define a Lei Geral de Proteção de Dados (Lei 13.709/2018, a LGPD).",
        `Qualquer assunto sobre os seus dados vai para ${EMAIL}.`,
      ],
    },
    {
      id: "dados",
      titulo: "Quais dados usamos e para quê",
      blocos: [
        "Pedimos só o que cada parte do site precisa para funcionar:",
        {
          itens: [
            "Conta: nome, e-mail e telefone, para identificar você, permitir o login e falar sobre os seus pedidos. A senha fica guardada só de forma cifrada (hash): ninguém do Kolô consegue lê-la.",
            "Sessão: um cookie de login e, no nosso banco, o endereço IP e o navegador usados para entrar. Servem para manter você conectado com segurança e encerrar a sessão quando você sai.",
            "Proteção contra abuso: quantas tentativas de login e de recuperação de senha foram feitas, ligadas a um código cifrado do IP e do e-mail, para bloquear tentativas repetidas por um tempo. O IP e o e-mail não ficam legíveis nesse registro.",
            "Recuperação de senha: um código de uso único, válido por 1 hora e guardado cifrado, e o registro do envio do e-mail (destinatário, data e situação).",
            "Endereço de entrega: destinatário, CEP, rua, número, complemento, bairro, cidade e estado, para entregar as suas compras. Cada conta guarda um endereço.",
            "Carrinho: as obras que você separou. Se você ainda não entrou na conta, um cookie identifica o carrinho neste navegador.",
            "Pedidos: obras, preços, valores, o endereço de entrega no momento da compra, código de rastreio e datas, para cumprir a compra e manter o registro da venda.",
            "Pagamentos: o identificador do pagamento no Mercado Pago, o meio escolhido (Pix, cartão ou boleto), a situação e o valor.",
            "Agenda do estúdio: depois que você combina uma tatuagem pelo WhatsApp, o artista ou a equipe registra nome e telefone de contato, artista, estilo, tamanho, região do corpo, a descrição da ideia e o horário combinado, para organizar a agenda.",
            "Artistas: o nome de cada artista aparece no portfólio e na ficha das obras.",
            "Formulário de contato: nome, e-mail e a mensagem que você escreve, para responder você. Para barrar spam, contamos os envios por endereço IP (até 3 envios a cada 15 minutos) e usamos a verificação da Cloudflare, que confere se quem envia é uma pessoa.",
          ],
        },
      ],
    },
    {
      id: "nao-coletamos",
      titulo: "O que não coletamos",
      blocos: [
        {
          itens: [
            "Dados de saúde. O site não tem ficha de anamnese nem pergunta nada sobre a sua saúde. A anamnese, o termo de consentimento e a conferência do documento acontecem presencialmente, no estúdio.",
            "Dados do cartão. O pagamento acontece no ambiente do Mercado Pago: não recebemos nem guardamos número, validade ou código de segurança do seu cartão.",
            "O que você preenche no pedido de tatuagem. O site só monta a mensagem e abre a conversa no WhatsApp; nada disso fica salvo no nosso banco.",
          ],
        },
      ],
    },
    {
      id: "bases-legais",
      titulo: "Por que podemos usar esses dados",
      blocos: [
        "A LGPD só permite usar dados pessoais com uma base legal. As nossas são:",
        {
          itens: [
            "Execução de contrato (art. 7º, V): conta, carrinho, pedidos, pagamento, entrega e agenda.",
            "Cumprimento de obrigação legal (art. 7º, II): guardar o registro das vendas pelo prazo que a lei exige.",
            "Legítimo interesse (art. 7º, IX): segurança, como o registro de sessão, o limite de tentativas e o filtro de spam do contato, e responder a quem nos escreve pelo formulário de contato.",
          ],
        },
      ],
    },
    {
      id: "compartilhamento",
      titulo: "Com quem compartilhamos",
      blocos: [
        "Não vendemos os seus dados nem os usamos para publicidade. Eles só vão para quem ajuda o site a funcionar:",
        {
          itens: [
            "Mercado Pago, que processa os pagamentos e tem política de privacidade própria.",
            "Resend, que envia o e-mail de recuperação de senha.",
            "Cloudflare, que confere no formulário de contato se quem envia é uma pessoa (Turnstile) e recebe o seu endereço IP para isso.",
            "Os provedores que hospedam o site, o banco de dados e as imagens das obras.",
            "WhatsApp, quando você decide abrir uma conversa com o estúdio. O que você envia lá segue as regras do WhatsApp.",
            "Autoridades públicas, quando a lei exigir.",
          ],
        },
        "Alguns desses serviços ficam fora do Brasil, então os seus dados podem ser processados no exterior.",
      ],
    },
    {
      id: "cookies",
      titulo: "Cookies",
      blocos: [
        "Usamos só os cookies necessários para o site funcionar: o de login, que mantém a sua sessão e não pode ser lido por scripts da página, e o do carrinho de quem ainda não entrou na conta.",
        "Não usamos cookies de publicidade nem de rastreamento. Se você bloquear os cookies no navegador, o login e o carrinho deixam de funcionar.",
      ],
    },
    {
      id: "guarda",
      titulo: "Por quanto tempo guardamos",
      blocos: [
        {
          itens: [
            "Conta e endereço: enquanto a conta existir.",
            "Sessões: até você sair ou a sessão expirar.",
            "Código de recuperação de senha: vale por 1 hora e para um único uso.",
            "Contagem de tentativas: vale só durante a janela de bloqueio, de 15 minutos (login e contato) a 1 hora (recuperação de senha).",
            "Mensagens de contato: pelo tempo necessário para responder e acompanhar o atendimento.",
            "Pedidos e pagamentos: pelo prazo exigido pelas leis fiscais e de defesa do consumidor, mesmo depois da exclusão da conta, sem ligação com os seus dados pessoais.",
            "Agenda: enquanto for necessária para organizar o atendimento.",
            "Cópias de segurança: o banco tem cópias diárias, mantidas por tempo limitado, para recuperar o site em caso de falha.",
          ],
        },
      ],
    },
    {
      id: "direitos",
      titulo: "Seus direitos",
      blocos: [
        "Pela LGPD, você pode pedir a qualquer momento:",
        {
          itens: [
            "confirmação de que tratamos os seus dados e acesso a eles;",
            "correção de dados incompletos ou desatualizados. Nome e telefone você muda direto em [Minha conta](/conta);",
            "exclusão da conta. Os pedidos pagos continuam guardados, mas anonimizados, sem ligação com você, porque precisamos manter o registro das vendas;",
            "portabilidade dos dados, informação sobre com quem os compartilhamos e oposição a um tratamento.",
          ],
        },
        `Para qualquer um desses pedidos, escreva para ${EMAIL}. Respondemos no prazo da LGPD.`,
        "Se achar que não resolvemos, você pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).",
      ],
    },
    {
      id: "seguranca",
      titulo: "Segurança",
      blocos: [
        "Usamos conexão segura (HTTPS), senhas cifradas, cookies de sessão protegidos, limite de tentativas de login e acesso restrito às áreas de administração.",
        "Nenhum sistema é totalmente seguro. Se um incidente puder trazer risco a você, avisaremos você e a ANPD, como a LGPD exige.",
      ],
    },
    {
      id: "mudancas",
      titulo: "Mudanças nesta política",
      blocos: ["Quando esta política mudar, a data no topo da página é atualizada."],
    },
  ],
};
