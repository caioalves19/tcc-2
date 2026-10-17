import { Prisma } from "../../../generated/prisma/client";
import { conferirSenha, sessaoDaRequisicao } from "../../lib/auth";
import { obterPrisma } from "../../lib/prisma";
import type { DadosEndereco } from "../endereco/index";
import { validarExclusaoConta, type DadosExclusaoConta, type ErrosDe } from "../identity/index";
import { cancelarPedidoPendente } from "../orders/index";

// RN12/RNF19 (PBI-40): o cliente exclui a própria conta. Os dados pessoais são anonimizados e os
// pedidos ficam, com os mesmos valores, para o registro da venda.

export type ErroExclusao =
  "nao_autenticado" | "proibido" | "senha_incorreta" | "pedido_em_andamento" | "concorrencia";

export type ResultadoExclusao =
  | { ok: true }
  | { ok: false; erro: "invalido"; campos: ErrosDe<DadosExclusaoConta> }
  | { ok: false; erro: ErroExclusao; mensagem: string };

class Recusa extends Error {
  constructor(
    readonly codigo: ErroExclusao,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

function expirada() {
  return new Recusa("nao_autenticado", "Sua sessão expirou. Entre novamente.");
}

// Pago e ainda não entregue: o ateliê precisa do endereço para concluir a entrega.
const EM_ANDAMENTO = ["PAGO", "PROCESSANDO", "ENVIADO"] as const;

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
  const validacao = validarExclusaoConta(entrada);
  if (!validacao.ok) return { ok: false, erro: "invalido", campos: validacao.campos };
  try {
    const sessao = await sessaoDaRequisicao(cabecalhos);
    if (!sessao) throw expirada();
    await obterPrisma().$transaction(async (tx) => {
      // O usuário vem só do cookie assinado. A trava do usuário vem primeiro, na mesma ordem do
      // checkout e do webhook (usuário → pedido → sessão): um pagamento aprovado ou um pedido
      // criado ao mesmo tempo termina antes, e as checagens abaixo já o enxergam.
      const dono = await tx.session.findUnique({
        where: { token: sessao.token },
        select: { userId: true },
      });
      if (!dono) throw expirada();
      await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${dono.userId}::uuid FOR UPDATE`;
      const atual = await tx.session.findUnique({
        where: { token: sessao.token },
        include: { user: true },
      });
      if (!atual || atual.expiresAt <= new Date()) throw expirada();
      if (
        atual.user.role !== "CLIENTE" ||
        atual.user.status !== "ATIVO" ||
        atual.user.deletedAt !== null
      )
        throw new Recusa(
          "proibido",
          "Só a conta de cliente pode ser excluída pelo site. Fale com o ateliê.",
        );
      const credencial = await tx.account.findFirst({
        where: { userId: atual.userId, provider: "credential" },
      });
      if (
        !credencial?.passwordHash ||
        !(await conferirSenha(credencial.passwordHash, validacao.dados.senha))
      )
        throw new Recusa("senha_incorreta", "Senha atual incorreta.");
      const emAndamento = await tx.order.count({
        where: { userId: atual.userId, deletedAt: null, status: { in: [...EM_ANDAMENTO] } },
      });
      if (emAndamento > 0)
        throw new Recusa(
          "pedido_em_andamento",
          "Você tem um pedido a caminho. Aguarde a entrega para excluir a conta ou fale com o ateliê.",
        );
      await anonimizarCliente(tx, atual.userId, new Date());
    });
    return { ok: true };
  } catch (erro) {
    if (erro instanceof Recusa) return { ok: false, erro: erro.codigo, mensagem: erro.message };
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2034")
      return {
        ok: false,
        erro: "concorrencia",
        mensagem: "Sua conta mudou enquanto excluíamos. Tente novamente.",
      };
    throw erro;
  }
}
