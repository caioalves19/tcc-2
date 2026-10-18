import { ADMIN, ARTISTA, CLIENTE, OBRA, PEDIDO_PAGO, OUTRO_ARTISTA } from "./dados";

// RNF20/RNF21: as telas que a varredura percorre, por papel. Visitante não entra; os outros
// entram pela tela de login com a conta da fixture.
export type Papel = "visitante" | "cliente" | "admin" | "artista";

export type Tela = { nome: string; caminho: string; papel: Papel; status?: number };

export const CONTA_DO_PAPEL: Record<Exclude<Papel, "visitante">, string> = {
  cliente: CLIENTE.email,
  admin: ADMIN.email,
  artista: ARTISTA.email,
};

export const TELAS: Tela[] = [
  // Visitante
  { nome: "home", caminho: "/", papel: "visitante" },
  { nome: "catálogo", caminho: "/obras", papel: "visitante" },
  { nome: "ficha da obra", caminho: `/obras/${OBRA.slug}`, papel: "visitante" },
  {
    nome: "obra inexistente",
    caminho: "/obras/obra-que-nao-existe",
    papel: "visitante",
    status: 404,
  },
  { nome: "galeria de tatuagens", caminho: "/tatuagens", papel: "visitante" },
  { nome: "agendamento", caminho: "/agendamento", papel: "visitante" },
  { nome: "contato", caminho: "/contato", papel: "visitante" },
  { nome: "política de privacidade", caminho: "/politicas/privacidade", papel: "visitante" },
  { nome: "termos de uso", caminho: "/politicas/termos", papel: "visitante" },
  { nome: "política de cancelamento", caminho: "/politicas/cancelamento", papel: "visitante" },
  { nome: "login", caminho: "/login", papel: "visitante" },
  { nome: "cadastro", caminho: "/cadastro", papel: "visitante" },
  { nome: "esqueci a senha", caminho: "/esqueci-senha", papel: "visitante" },
  { nome: "redefinir senha", caminho: "/redefinir-senha", papel: "visitante" },
  { nome: "carrinho vazio", caminho: "/carrinho", papel: "visitante" },
  // Cliente
  { nome: "minha conta", caminho: "/conta", papel: "cliente" },
  { nome: "meus pedidos", caminho: "/conta/pedidos", papel: "cliente" },
  {
    nome: "detalhe do pedido",
    caminho: `/conta/pedidos/${PEDIDO_PAGO.numero}`,
    papel: "cliente",
  },
  { nome: "carrinho com obra", caminho: "/carrinho", papel: "cliente" },
  { nome: "checkout", caminho: "/checkout", papel: "cliente" },
  { nome: "pedido no checkout", caminho: `/checkout/${PEDIDO_PAGO.numero}`, papel: "cliente" },
  // Admin
  { nome: "admin", caminho: "/admin", papel: "admin" },
  { nome: "admin obras", caminho: "/admin/obras", papel: "admin" },
  { nome: "admin artistas", caminho: "/admin/artistas", papel: "admin" },
  { nome: "admin estilos", caminho: "/admin/estilos", papel: "admin" },
  { nome: "admin tags", caminho: "/admin/tags", papel: "admin" },
  { nome: "admin pedidos", caminho: "/admin/pedidos?filtro=todos", papel: "admin" },
  {
    nome: "admin detalhe do pedido",
    caminho: `/admin/pedidos/${PEDIDO_PAGO.numero}`,
    papel: "admin",
  },
  { nome: "admin clientes", caminho: "/admin/clientes", papel: "admin" },
  { nome: "admin perfil do cliente", caminho: `/admin/clientes/${CLIENTE.userId}`, papel: "admin" },
  { nome: "admin configurações", caminho: "/admin/configuracoes", papel: "admin" },
  { nome: "agenda do admin", caminho: "/agenda", papel: "admin" },
  {
    nome: "portfólio pelo admin",
    caminho: `/portfolio/gestao?artista=${OUTRO_ARTISTA.id}`,
    papel: "admin",
  },
  // Artista
  { nome: "portfólio da artista", caminho: "/portfolio/gestao", papel: "artista" },
  { nome: "agenda da artista", caminho: "/agenda", papel: "artista" },
];
