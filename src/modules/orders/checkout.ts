import { randomBytes } from "node:crypto";
import { z } from "zod";
import { Prisma } from "../../../generated/prisma/client";
import { obterPrisma } from "../../lib/prisma";
import { validarEndereco, type DadosEndereco } from "../endereco/index";
import { lerCarrinho, sessaoAtiva, type ContextoCarrinho } from "./carrinho";
import { numeroDoPedido } from "./regras";
import { reservarItens } from "./reserva";

// PBI-26: retirada no ateliê é a modalidade mínima, sem custo. As outras entram no PBI-42.
export type Modalidade = "RETIRADA";
const FRETE_RETIRADA_CENTAVOS = 0;

export type ItemCheckout = {
  obraId: string;
  titulo: string;
  artistaNome: string;
  quantidade: number;
  precoCentavos: number;
  chaveMiniatura: string | null;
  textoAlternativo: string;
};
export type ResumoCheckout = {
  itens: ItemCheckout[];
  endereco: DadosEndereco;
  modalidade: Modalidade;
  subtotalCentavos: number;
  freteCentavos: number;
  totalCentavos: number;
};
export type ResultadoCheckout<T> =
  | { ok: true; dados: T }
  | {
      ok: false;
      erro: "nao_autenticado" | "carrinho_vazio" | "sem_endereco" | "falha";
      mensagem: string;
    }
  | { ok: false; erro: "indisponivel"; obras: string[]; mensagem: string };

export type ResultadoFinalizar =
  | ResultadoCheckout<{ numero: string; expiraEm: Date }>
  | { ok: false; erro: "invalido"; mensagem: string }
  | { ok: false; erro: "pendente"; numero: string; mensagem: string };

export type OpcoesFinalizar = { agora?: Date; gerarNumero?: (agora: Date) => string };

type Comprador = { userId: string; sessaoId: string };

// RF12/RN07: itens, preços e endereço vêm do banco; o total é calculado aqui, em centavos.
export async function resumoCheckout(
  contexto: ContextoCarrinho,
  agora: Date = new Date(),
): Promise<ResultadoCheckout<ResumoCheckout>> {
  const montado = await montarResumo(contexto, agora);
  return montado.ok ? { ok: true, dados: montado.dados.resumo } : montado;
}

async function montarResumo(
  contexto: ContextoCarrinho,
  agora: Date,
): Promise<ResultadoCheckout<{ resumo: ResumoCheckout; comprador: Comprador }>> {
  const sessao = await sessaoAtiva(contexto.cabecalhos);
  if (!sessao)
    return { ok: false, erro: "nao_autenticado", mensagem: "Entre na sua conta para comprar." };
  const { userId, sessaoId } = sessao;
  const carrinho = await lerCarrinho(contexto);
  if (!carrinho.ok) return { ok: false, erro: "falha", mensagem: carrinho.mensagem };
  if (carrinho.dados.itens.length === 0)
    return { ok: false, erro: "carrinho_vazio", mensagem: "Seu carrinho está vazio." };

  // RN02/RN11: a obra precisa seguir à venda, e as unidades presas por outros clientes não
  // contam. As reservas do próprio cliente, em qualquer sessão, são de um pedido dele: o
  // abandonado o finalizar cancela, e o com pagamento em aberto o leva de volta ao pedido.
  // A conferência com trava fica com reservarItens, dentro da transação.
  const presas = await obterPrisma().artworkReservation.groupBy({
    by: ["artworkId"],
    where: {
      artworkId: { in: carrinho.dados.itens.map((i) => i.obraId) },
      expiresAt: { gt: agora },
      session: { userId: { not: userId } },
    },
    _sum: { quantity: true },
  });
  const presasDe = (id: string) => presas.find((r) => r.artworkId === id)?._sum.quantity ?? 0;
  const indisponiveis = carrinho.dados.itens
    .filter((i) => !i.disponivel || i.estoque - presasDe(i.obraId) < i.quantidade)
    .map((i) => i.obraId);
  if (indisponiveis.length > 0)
    return {
      ok: false,
      erro: "indisponivel",
      obras: indisponiveis,
      mensagem: "Algumas obras do carrinho não estão mais disponíveis nessa quantidade.",
    };
  const linha = await obterPrisma().address.findUnique({ where: { userId } });
  const endereco = linha
    ? validarEndereco({
        destinatario: linha.recipient,
        cep: linha.postalCode,
        logradouro: linha.street,
        numero: linha.number,
        complemento: linha.complement ?? "",
        bairro: linha.neighborhood,
        cidade: linha.city,
        uf: linha.state,
      })
    : null;
  if (!endereco?.ok)
    return {
      ok: false,
      erro: "sem_endereco",
      mensagem: "Cadastre um endereço válido na sua conta antes de finalizar.",
    };

  const itens = carrinho.dados.itens.map((item) => ({
    obraId: item.obraId,
    titulo: item.titulo,
    artistaNome: item.artistaNome,
    quantidade: item.quantidade,
    precoCentavos: item.precoCentavos,
    chaveMiniatura: item.chaveMiniatura,
    textoAlternativo: item.textoAlternativo,
  }));
  const subtotalCentavos = itens.reduce((soma, i) => soma + i.precoCentavos * i.quantidade, 0);
  return {
    ok: true,
    dados: {
      resumo: {
        itens,
        endereco: endereco.dados,
        modalidade: "RETIRADA",
        subtotalCentavos,
        freteCentavos: FRETE_RETIRADA_CENTAVOS,
        totalCentavos: subtotalCentavos + FRETE_RETIRADA_CENTAVOS,
      },
      comprador: { userId, sessaoId },
    },
  };
}

// O formulário só escolhe a modalidade. Preço, total, quantidade e endereço que venham junto
// são descartados pelo schema: o pedido sai do banco (RN07).
const schemaFinalizar = z.object({
  modalidade: z.literal("RETIRADA", { error: "Escolha uma forma de entrega válida." }),
});

// O número é sorteado; se repetir um existente, a transação inteira cai e roda de novo.
const TENTATIVAS_NUMERO = 5;
const FALHA_FINALIZAR = {
  ok: false,
  erro: "falha",
  mensagem: "Não foi possível finalizar a compra agora. Tente novamente.",
} as const;

// Recusa no meio da transação: lançada para o Prisma desfazer o que já foi feito (o cancelamento
// do pedido abandonado, por exemplo) e devolvida como resultado fora dela.
class Recusa extends Error {
  constructor(public resultado: ResultadoFinalizar) {
    super("recusa no checkout");
  }
}

// Nesta transação o único UNIQUE que pode falhar é o número do pedido.
function numeroRepetido(erro: unknown): boolean {
  return erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002";
}

// RF12/RF15: o pedido PENDENTE e a reserva de 10 minutos nascem na mesma transação; se um
// falha, o outro não fica. O pedido guarda cópias de endereço, títulos e preços.
export async function finalizarCompra(
  entrada: unknown,
  contexto: ContextoCarrinho,
  opcoes: OpcoesFinalizar = {},
): Promise<ResultadoFinalizar> {
  const agora = opcoes.agora ?? new Date();
  const gerarNumero = opcoes.gerarNumero ?? ((data: Date) => numeroDoPedido(data, randomBytes(6)));
  const validado = schemaFinalizar.safeParse(entrada);
  if (!validado.success)
    return {
      ok: false,
      erro: "invalido",
      mensagem: validado.error.issues.map((i) => i.message).join(" "),
    };
  const montado = await montarResumo(contexto, agora);
  if (!montado.ok) return montado;
  const { resumo, comprador } = montado.dados;

  const criar = async (tx: Prisma.TransactionClient): Promise<ResultadoFinalizar> => {
    // Cliques simultâneos da mesma conta se enfileiram aqui: cada um vê o pedido que o anterior
    // criou e o cancela, e sobra um PENDENTE só. Ordem das travas: usuário → sessão → obras.
    await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${comprador.userId}::uuid FOR UPDATE`;

    // RN06: com Pix ou boleto em aberto, o cliente volta ao pedido (pagar ou cancelar); um novo
    // checkout não o substitui nem mexe na reserva prorrogada.
    const emAberto = await tx.order.findFirst({
      where: {
        userId: comprador.userId,
        status: "PENDENTE",
        payments: { some: { status: "PENDENTE" } },
      },
    });
    if (emAberto)
      throw new Recusa({
        ok: false,
        erro: "pendente",
        numero: emAberto.number,
        mensagem: "Você já tem um pedido aguardando pagamento.",
      });

    // Pedido PENDENTE sem pagamento em aberto foi abandonado (ou o pagamento foi recusado): o
    // novo checkout o cancela e solta as unidades que ele segurava, mesmo que tenham sido
    // reservadas em outra sessão da conta.
    const abandonados = await tx.order.findMany({
      where: {
        userId: comprador.userId,
        status: "PENDENTE",
        payments: { none: { status: "PENDENTE" } },
      },
    });
    if (abandonados.length > 0) {
      await tx.order.updateMany({
        where: { id: { in: abandonados.map((p) => p.id) } },
        data: { status: "CANCELADO" },
      });
      const sessoes = abandonados.flatMap((p) => (p.sessionId ? [p.sessionId] : []));
      await tx.artworkReservation.deleteMany({ where: { sessionId: { in: sessoes } } });
    }

    const reserva = await reservarItens(
      comprador.sessaoId,
      resumo.itens.map((i) => ({ obraId: i.obraId, quantidade: i.quantidade })),
      agora,
      tx,
    );
    if (!reserva.ok)
      throw new Recusa(
        reserva.erro === "indisponivel"
          ? {
              ok: false,
              erro: "indisponivel",
              obras: reserva.obras,
              mensagem: "Algumas obras do carrinho não estão mais disponíveis nessa quantidade.",
            }
          : { ok: false, erro: "falha", mensagem: "Não foi possível reservar as obras agora." },
      );

    const numero = gerarNumero(agora);
    await tx.order.create({
      data: {
        number: numero,
        userId: comprador.userId,
        sessionId: comprador.sessaoId,
        deliveryMethod: validado.data.modalidade,
        subtotalCents: resumo.subtotalCentavos,
        shippingCents: resumo.freteCentavos,
        totalCents: resumo.totalCentavos,
        addressSnapshot: resumo.endereco,
        createdAt: agora,
        items: {
          create: resumo.itens.map((i) => ({
            artworkId: i.obraId,
            titleSnapshot: i.titulo,
            priceCents: i.precoCentavos,
            quantity: i.quantidade,
          })),
        },
      },
    });
    return { ok: true, dados: { numero, expiraEm: reserva.dados.expiraEm } };
  };

  for (let tentativa = 1; tentativa <= TENTATIVAS_NUMERO; tentativa++) {
    try {
      return await obterPrisma().$transaction(criar);
    } catch (erro) {
      if (erro instanceof Recusa) return erro.resultado;
      if (numeroRepetido(erro) && tentativa < TENTATIVAS_NUMERO) continue;
      console.error(
        "Falha ao finalizar a compra",
        erro instanceof Error ? erro.name : "erro desconhecido",
      );
      return FALHA_FINALIZAR;
    }
  }
  return FALHA_FINALIZAR;
}
