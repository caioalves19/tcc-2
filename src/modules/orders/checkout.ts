import { obterPrisma } from "../../lib/prisma";
import { validarEndereco, type DadosEndereco } from "../endereco/index";
import { lerCarrinho, sessaoAtiva, type ContextoCarrinho } from "./carrinho";
import { estoqueDisponivel } from "./reserva";

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

// RF12/RN07: itens, preços e endereço vêm do banco; o total é calculado aqui, em centavos.
export async function resumoCheckout(
  contexto: ContextoCarrinho,
  agora: Date = new Date(),
): Promise<ResultadoCheckout<ResumoCheckout>> {
  const sessao = await sessaoAtiva(contexto.cabecalhos);
  if (!sessao)
    return { ok: false, erro: "nao_autenticado", mensagem: "Entre na sua conta para comprar." };
  const { userId, sessaoId } = sessao;
  const carrinho = await lerCarrinho(contexto);
  if (!carrinho.ok) return { ok: false, erro: "falha", mensagem: carrinho.mensagem };
  if (carrinho.dados.itens.length === 0)
    return { ok: false, erro: "carrinho_vazio", mensagem: "Seu carrinho está vazio." };

  // RN02/RN11: a obra precisa seguir à venda, e as unidades presas por outra sessão não contam.
  const indisponiveis: string[] = [];
  for (const item of carrinho.dados.itens)
    if (
      !item.disponivel ||
      (await estoqueDisponivel(item.obraId, agora, sessaoId)) < item.quantidade
    )
      indisponiveis.push(item.obraId);
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
      itens,
      endereco: endereco.dados,
      modalidade: "RETIRADA",
      subtotalCentavos,
      freteCentavos: FRETE_RETIRADA_CENTAVOS,
      totalCentavos: subtotalCentavos + FRETE_RETIRADA_CENTAVOS,
    },
  };
}
