import {
  ADMIN,
  ARTISTA,
  CLIENTE,
  HORARIO,
  OBRA,
  OBRA_CARRINHO,
  OBRA_VENDIDA,
  OUTRO_ARTISTA,
  PEDIDO_PAGO,
  TRABALHO_DA_ARTISTA,
} from "./dados";

// RNF20/RNF21: as telas que a varredura percorre, por papel. Visitante não entra; os outros
// entram pela tela de login com a conta da fixture.
export type Papel = "visitante" | "cliente" | "admin" | "artista";

// `marco`: texto que só aparece no conteúdo certo da tela (dentro do <main>). Junto com a URL
// final, impede que um redirecionamento para o login ou uma tela de erro passe como a tela varrida.
export type Tela = {
  nome: string;
  caminho: string;
  papel: Papel;
  marco: string | RegExp;
  status?: number;
};

export const CONTA_DO_PAPEL: Record<Exclude<Papel, "visitante">, string> = {
  cliente: CLIENTE.email,
  admin: ADMIN.email,
  artista: ARTISTA.email,
};

// A agenda abre na semana do horário da fixture, não na de hoje.
const AGENDA = `/agenda?semana=${HORARIO.semana}`;

export const TELAS: Tela[] = [
  // Visitante
  { nome: "home", caminho: "/", papel: "visitante", marco: /pessoas reais/i },
  { nome: "catálogo", caminho: "/obras", papel: "visitante", marco: OBRA.titulo },
  {
    nome: "ficha da obra",
    caminho: `/obras/${OBRA.slug}`,
    papel: "visitante",
    marco: OBRA.titulo,
  },
  {
    nome: "obra inexistente",
    caminho: "/obras/obra-que-nao-existe",
    papel: "visitante",
    marco: "Esta obra não existe ou não está mais na vitrine.",
    status: 404,
  },
  {
    nome: "galeria de tatuagens",
    caminho: "/tatuagens",
    papel: "visitante",
    marco: TRABALHO_DA_ARTISTA.titulo,
  },
  { nome: "agendamento", caminho: "/agendamento", papel: "visitante", marco: "Seu nome" },
  { nome: "contato", caminho: "/contato", papel: "visitante", marco: /envie sua dúvida/i },
  {
    nome: "política de privacidade",
    caminho: "/politicas/privacidade",
    papel: "visitante",
    marco: /privacidade/i,
  },
  { nome: "termos de uso", caminho: "/politicas/termos", papel: "visitante", marco: /termos/i },
  {
    nome: "política de cancelamento",
    caminho: "/politicas/cancelamento",
    papel: "visitante",
    marco: /cancelamento/i,
  },
  { nome: "login", caminho: "/login", papel: "visitante", marco: /esqueci/i },
  { nome: "cadastro", caminho: "/cadastro", papel: "visitante", marco: "Criar conta" },
  { nome: "esqueci a senha", caminho: "/esqueci-senha", papel: "visitante", marco: /esqueci/i },
  {
    nome: "redefinir senha",
    caminho: "/redefinir-senha",
    papel: "visitante",
    marco: /nova senha/i,
  },
  {
    nome: "carrinho vazio",
    caminho: "/carrinho",
    papel: "visitante",
    marco: "Seu carrinho está vazio.",
  },
  // Cliente
  { nome: "minha conta", caminho: "/conta", papel: "cliente", marco: "Salvar endereço" },
  {
    nome: "meus pedidos",
    caminho: "/conta/pedidos",
    papel: "cliente",
    marco: `Pedido ${PEDIDO_PAGO.numero}`,
  },
  {
    nome: "detalhe do pedido",
    caminho: `/conta/pedidos/${PEDIDO_PAGO.numero}`,
    papel: "cliente",
    marco: OBRA_VENDIDA.titulo,
  },
  {
    nome: "carrinho com obra",
    caminho: "/carrinho",
    papel: "cliente",
    marco: OBRA_CARRINHO.titulo,
  },
  { nome: "checkout", caminho: "/checkout", papel: "cliente", marco: OBRA_CARRINHO.titulo },
  {
    nome: "pedido no checkout",
    caminho: `/checkout/${PEDIDO_PAGO.numero}`,
    papel: "cliente",
    marco: PEDIDO_PAGO.numero,
  },
  // Admin
  // PBI-48: a página inicial do admin é o painel de indicadores.
  { nome: "admin painel", caminho: "/admin", papel: "admin", marco: "Pedidos agora" },
  // O pedido pago da fixture tem pago_em = now(): está sempre nos últimos 30 dias.
  {
    nome: "admin relatório de vendas",
    caminho: "/admin/relatorio?periodo=30-dias",
    papel: "admin",
    marco: OBRA_VENDIDA.titulo,
  },
  { nome: "admin obras", caminho: "/admin/obras", papel: "admin", marco: OBRA.titulo },
  { nome: "admin artistas", caminho: "/admin/artistas", papel: "admin", marco: ARTISTA.nome },
  { nome: "admin estilos", caminho: "/admin/estilos", papel: "admin", marco: "Fineline" },
  { nome: "admin tags", caminho: "/admin/tags", papel: "admin", marco: "Tags das obras" },
  {
    nome: "admin pedidos",
    caminho: "/admin/pedidos?filtro=todos",
    papel: "admin",
    marco: PEDIDO_PAGO.numero,
  },
  {
    nome: "admin detalhe do pedido",
    caminho: `/admin/pedidos/${PEDIDO_PAGO.numero}`,
    papel: "admin",
    marco: OBRA_VENDIDA.titulo,
  },
  { nome: "admin clientes", caminho: "/admin/clientes", papel: "admin", marco: CLIENTE.nome },
  {
    nome: "admin perfil do cliente",
    caminho: `/admin/clientes/${CLIENTE.userId}`,
    papel: "admin",
    marco: CLIENTE.email,
  },
  {
    nome: "admin configurações",
    caminho: "/admin/configuracoes",
    papel: "admin",
    marco: "Configurações do site",
  },
  { nome: "agenda do admin", caminho: AGENDA, papel: "admin", marco: HORARIO.contato },
  {
    nome: "portfólio pelo admin",
    caminho: `/portfolio/gestao?artista=${OUTRO_ARTISTA.id}`,
    papel: "admin",
    marco: OUTRO_ARTISTA.trabalho.titulo,
  },
  // Artista
  {
    nome: "portfólio da artista",
    caminho: "/portfolio/gestao",
    papel: "artista",
    marco: TRABALHO_DA_ARTISTA.titulo,
  },
  { nome: "agenda da artista", caminho: AGENDA, papel: "artista", marco: HORARIO.contato },
];
