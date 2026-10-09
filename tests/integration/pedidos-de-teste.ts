import type { Client } from "pg";
import { comCookie, SENHA } from "./contas-pbi17";

// Pedidos de teste dos PBIs 29 e 30, gravados direto no banco: pagamento (27/28) ainda não tem
// fluxo próprio. Cada pagamento leva um payload que nenhuma tela pode mostrar.

export const ENDERECO_TESTE = {
  destinatario: "Lucas Silveira",
  cep: "01327000",
  logradouro: "Rua Treze de Maio",
  numero: "450",
  complemento: "Apto 82",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "SP",
};

export type ClienteTeste = {
  cabecalhos: Headers;
  tokenVisitante: null;
  userId: string;
  sessaoId: string;
};

export type PedidoTeste = {
  numero: string;
  situacao: "PENDENTE" | "PAGO" | "PROCESSANDO" | "ENVIADO" | "ENTREGUE" | "CANCELADO";
  criadoEm: string;
  // A reserva é da sessão na obra; pedidos de compras diferentes usam obras diferentes.
  obra: string;
  pagamentos?: ("PENDENTE" | "APROVADO" | "RECUSADO" | "ESTORNADO")[];
  reservaAte?: string;
  rastreio?: string;
  pagoEm?: string;
  enviadoEm?: string;
  excluido?: boolean;
};

export function fabricaDePedidos(db: Client, admin: Headers, artistaId: string) {
  async function obraPublicada(slug: string, preco: string, estoque: number) {
    const { criarObra, editarObra } = await import("../../src/modules/catalog");
    const ficha = { titulo: `Obra ${slug}`, slug, artistaId, preco, estoque: String(estoque) };
    const criada = await criarObra(ficha, admin);
    if (!criada.ok) throw new Error(criada.mensagem);
    await db.query(
      "INSERT INTO artwork_image (id, artwork_id, url, ordem, principal, texto_alternativo) VALUES (gen_random_uuid(), $1, $2, 1, true, 'Foto')",
      [criada.dados.id, `obras/${artistaId}/${criada.dados.id}.png`],
    );
    const publicada = await editarObra({ ...ficha, id: criada.dados.id, publicada: true }, admin);
    if (!publicada.ok) throw new Error(publicada.mensagem);
    return criada.dados.id;
  }

  async function novoCliente(email: string, nome = "Cliente"): Promise<ClienteTeste> {
    const { cadastrarCliente } = await import("../../src/lib/auth");
    const { salvarEndereco } = await import("../../src/lib/endereco");
    const cadastro = await cadastrarCliente({ nome, email, telefone: "11987654321", senha: SENHA });
    if (!cadastro.ok) throw new Error("Falha ao cadastrar cliente");
    const cabecalhos = await comCookie(cadastro.token);
    const salvo = await salvarEndereco(ENDERECO_TESTE, cabecalhos);
    if (!salvo.ok) throw new Error("Falha ao salvar endereço");
    const { rows } = await db.query(
      'SELECT s.id, s.user_id FROM session s JOIN "user" u ON u.id = s.user_id WHERE u.email = $1',
      [email],
    );
    return { cabecalhos, tokenVisitante: null, userId: rows[0].user_id, sessaoId: rows[0].id };
  }

  // Dois itens da mesma obra: 2 × R$ 4.800,00.
  async function pedidoDeTeste(cliente: ClienteTeste, p: PedidoTeste) {
    const { rows } = await db.query(
      `INSERT INTO "order" (id, numero, user_id, session_id, modalidade_entrega, situacao,
         subtotal_centavos, frete_centavos, total_centavos, endereco_copia, codigo_rastreio,
         criado_em, pago_em, enviado_em, excluido_em)
       VALUES (gen_random_uuid(), $1, $2, $3, 'RETIRADA', $4, 960000, 0, 960000, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        p.numero,
        cliente.userId,
        cliente.sessaoId,
        p.situacao,
        JSON.stringify(ENDERECO_TESTE),
        p.rastreio ?? null,
        p.criadoEm,
        p.pagoEm ?? null,
        p.enviadoEm ?? null,
        p.excluido ? p.criadoEm : null,
      ],
    );
    const pedidoId: string = rows[0].id;
    await db.query(
      `INSERT INTO order_item (id, order_id, artwork_id, titulo_copia, preco_centavos_copia, quantidade)
       VALUES (gen_random_uuid(), $1, $2, 'Metrópole em chamas', 480000, 2)`,
      [pedidoId, p.obra],
    );
    for (const [indice, situacao] of (p.pagamentos ?? []).entries())
      await db.query(
        `INSERT INTO payment (id, order_id, provedor, id_externo, metodo, situacao, valor_centavos, payload)
         VALUES (gen_random_uuid(), $1, 'mercado_pago', $2, 'PIX', $3, 960000, '{"segredo":"nao-mostrar"}')`,
        [pedidoId, `mp-${p.numero}-${indice + 1}`, situacao],
      );
    if (p.reservaAte)
      await db.query(
        `INSERT INTO artwork_reservation (id, artwork_id, session_id, quantidade, expira_em)
         VALUES (gen_random_uuid(), $1, $2, 2, $3)`,
        [p.obra, cliente.sessaoId, p.reservaAte],
      );
    return pedidoId;
  }

  return { obraPublicada, novoCliente, pedidoDeTeste };
}
