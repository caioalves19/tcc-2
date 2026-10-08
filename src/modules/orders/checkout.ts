import { obterPrisma } from "../../lib/prisma";
import { validarEndereco, type DadosEndereco } from "../endereco/index";
import { lerCarrinho, usuarioDaSessao, type ContextoCarrinho } from "./carrinho";

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
    };

// RF12/RN07: itens, preços e endereço vêm do banco; o total é calculado aqui, em centavos.
export async function resumoCheckout(
  contexto: ContextoCarrinho,
): Promise<ResultadoCheckout<ResumoCheckout>> {
  const userId = await usuarioDaSessao(contexto.cabecalhos);
  if (!userId)
    return { ok: false, erro: "nao_autenticado", mensagem: "Entre na sua conta para comprar." };
  const carrinho = await lerCarrinho(contexto);
  if (!carrinho.ok) return { ok: false, erro: "falha", mensagem: carrinho.mensagem };
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
