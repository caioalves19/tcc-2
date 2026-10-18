// Dados fixos do E2E: o preparo do banco grava estes valores e os testes os esperam de volta.
// Fictícios e só de teste; o banco kolo_e2e é recriado a cada rodada.

export const PORTA_E2E = 3200;
export const BANCO_E2E = "kolo_e2e";

export const ARTISTA = {
  userId: "00000000-0000-4000-9000-000000000001",
  id: "00000000-0000-4000-9000-000000000002",
  nome: "Bia Traço",
  email: "e2e-artista@kolo.test",
  slug: "bia-traco",
};

export const ESTILOS = [
  { id: "00000000-0000-4000-9000-000000000011", nome: "Blackwork", slug: "blackwork" },
  { id: "00000000-0000-4000-9000-000000000012", nome: "Fineline", slug: "fineline" },
];

export const TAMANHOS = [
  { id: "00000000-0000-4000-9000-000000000021", nome: "Pequena", ordem: 1 },
  { id: "00000000-0000-4000-9000-000000000022", nome: "Média", ordem: 2 },
];

// Número de teste no formato do RF31 (55 + DDD + número), diferente do padrão do site.
export const WHATSAPP_E2E = "5511900000000";

// RF26/RN02: uma obra Disponível com uma unidade; depois da compra paga ela fica Esgotada.
export const OBRA = {
  id: "00000000-0000-4000-9000-000000000031",
  titulo: "Muro em Azul",
  slug: "muro-em-azul",
  precoCentavos: 15000,
};

// Pagamento que o Mercado Pago falso devolve aprovado para a última preferência criada.
export const ID_PAGAMENTO_E2E = "9000001";

// RF06: contas da equipe. A senha é a mesma para todas e sorteada a cada rodada
// (E2E_SENHA_EQUIPE, gerada no playwright.config.ts); nunca fica no código.
export const ADMIN = {
  userId: "00000000-0000-4000-9000-000000000041",
  nome: "Admin E2E",
  email: "e2e-admin@kolo.test",
};

// RN10: um segundo artista, com um trabalho no portfólio que a Bia não pode gerenciar.
export const OUTRO_ARTISTA = {
  userId: "00000000-0000-4000-9000-000000000051",
  id: "00000000-0000-4000-9000-000000000052",
  nome: "Caio Linha",
  email: "e2e-outro-artista@kolo.test",
  slug: "caio-linha",
  trabalho: { id: "00000000-0000-4000-9000-000000000053", titulo: "Fechamento do Caio" },
};

// RF27: R2 fictício do E2E. O navegador envia para a URL assinada desse endpoint (o page.route a
// atende) e o servidor lê e grava pelo dublê; os dois usam a pasta E2E_R2_DIR.
export const R2_CONTA_E2E = "conta-ficticia-e2e";
export const R2_BUCKET_E2E = "kolo-e2e";
