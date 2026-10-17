import { Prisma } from "../../../generated/prisma/client";
import { sessaoDaRequisicao } from "../../lib/auth";
import { obterPrisma } from "../../lib/prisma";
import type { DadosEndereco } from "../endereco/index";
import { cancelarPedidoPendente } from "../orders/index";

// RN12/RNF19 (PBI-40): o cliente exclui a própria conta. Os dados pessoais são anonimizados e os
// pedidos ficam, com os mesmos valores, para o registro da venda.

export type ResultadoExclusao = { ok: true };

export const NOME_EXCLUIDO = "Cliente excluído";

// Único (o e-mail é UK) e num domínio reservado, que nunca recebe mensagem. Libera o e-mail antigo
// para um cadastro novo.
function emailAnonimo(userId: string) {
  return `excluido-${userId}@kolo.invalid`;
}

// Cidade e UF não identificam a pessoa e servem ao registro da venda; o resto vira vazio.
function enderecoAnonimo(copia: Prisma.JsonValue): DadosEndereco {
  const { cidade, uf } = copia as DadosEndereco;
  return {
    destinatario: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade,
    uf,
  };
}

async function anonimizarCliente(tx: Prisma.TransactionClient, userId: string, agora: Date) {
  await tx.user.update({
    where: { id: userId },
    data: {
      name: NOME_EXCLUIDO,
      email: emailAnonimo(userId),
      phone: null,
      image: null,
      deletedAt: agora,
    },
  });
  // Pedido aguardando pagamento é cancelado e solta a reserva. Um pagamento aprovado depois não
  // reabre o pedido: o webhook o marca para estorno (pedido não pendente, PBI-43).
  const pendentes = await tx.order.findMany({
    where: { userId, status: "PENDENTE" },
    select: { id: true },
  });
  for (const pedido of pendentes) await cancelarPedidoPendente(tx, pedido.id);
  // Sem sessão a conta sai de todos os navegadores (as reservas da sessão vão junto, em cascata);
  // sem credencial e com o e-mail trocado, o login antigo não abre mais. O carrinho leva os itens.
  await tx.session.deleteMany({ where: { userId } });
  await tx.account.deleteMany({ where: { userId } });
  await tx.address.deleteMany({ where: { userId } });
  await tx.cart.deleteMany({ where: { userId } });
  // Hoje só a recuperação de senha usa verification, e valor guarda o id do usuário.
  await tx.verification.deleteMany({ where: { value: userId } });
  // O atendimento registrado pela equipe fica na agenda, sem a ligação com a conta.
  await tx.appointment.updateMany({ where: { userId }, data: { userId: null } });
  await tx.emailLog.updateMany({ where: { userId }, data: { recipient: emailAnonimo(userId) } });
  const pedidos = await tx.order.findMany({
    where: { userId },
    select: { id: true, addressSnapshot: true },
  });
  for (const pedido of pedidos)
    await tx.order.update({
      where: { id: pedido.id },
      data: { addressSnapshot: enderecoAnonimo(pedido.addressSnapshot) },
    });
}

export async function excluirPropriaConta(
  entrada: unknown,
  cabecalhos: Headers,
): Promise<ResultadoExclusao> {
  void entrada;
  const sessao = await sessaoDaRequisicao(cabecalhos);
  if (!sessao) throw new Error("sem sessão");
  await obterPrisma().$transaction(async (tx) => {
    const atual = await tx.session.findUniqueOrThrow({ where: { token: sessao.token } });
    await anonimizarCliente(tx, atual.userId, new Date());
  });
  return { ok: true };
}
