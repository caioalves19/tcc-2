"use client";

import { useState } from "react";
import { TITULO_SECAO } from "@/components/conta/partes-pedido";
import { Button } from "@/components/ui/button";
import type { ResultadoGestao } from "@/modules/artists";
import { formatarPreco } from "@/modules/catalog/cliente";
import type { PedidoAdmin } from "@/modules/orders";
import {
  estornoCancelaPedido,
  estornoDevolveEstoque,
  type MotivoEstorno,
} from "@/modules/orders/cliente";
import { useGestao } from "./formulario";

type Pagamento = PedidoAdmin["pagamentos"][number];

type Props = {
  numero: string;
  cancelavel: boolean;
  pagamentos: PedidoAdmin["pagamentos"];
  // Server Actions num objeto: uma função comum não atravessa a fronteira servidor/cliente.
  acoes: {
    cancelarPedido: (entrada: { numero: string }) => Promise<ResultadoGestao<unknown>>;
    estornarPagamento: (entrada: {
      numero: string;
      idExterno: string;
    }) => Promise<ResultadoGestao<unknown>>;
  };
};

// Por que o webhook pediu o estorno (PBI-43, migração 0008).
const MOTIVO: Record<MotivoEstorno, string> = {
  PEDIDO_NAO_PENDENTE:
    "O pagamento chegou para um pedido que não aguardava pagamento (cancelado ou já pago).",
  VALOR_DIVERGENTE: "O valor pago é diferente do total do pedido.",
  SEM_ESTOQUE: "O pagamento foi aprovado quando não havia mais unidade livre.",
};

function efeitoNoPedido(motivo: MotivoEstorno | null): string {
  if (!estornoCancelaPedido(motivo)) return "O pedido não muda.";
  return estornoDevolveEstoque(motivo)
    ? "O pedido é cancelado e as obras voltam ao estoque."
    : "O pedido é cancelado; o estoque não muda.";
}

type Escolha =
  { tipo: "cancelar" } | { tipo: "estornar"; pagamento: Pagamento & { idExterno: string } };

// PBI-43 (complemento do RF29): cancelar o pedido não pago e estornar pagamentos pelo Mercado
// Pago. Nada disso volta atrás, então cada ação pede confirmação.
export function EstornoPedido({ numero, cancelavel, pagamentos, acoes }: Props) {
  const { pendente, executar, feedback } = useGestao();
  const [escolha, setEscolha] = useState<Escolha | null>(null);
  const estornaveis = pagamentos.flatMap((p) =>
    p.acaoEstorno && p.idExterno ? [{ ...p, idExterno: p.idExterno }] : [],
  );
  // Depois da última ação, a seção fica só com o aviso: o router.refresh() traz o pedido sem
  // nenhum botão, e a confirmação do que foi feito não pode sumir junto.
  if (!cancelavel && estornaveis.length === 0 && !feedback) return null;

  const voltar = () => setEscolha(null);
  return (
    <section aria-labelledby="admin-pedido-estorno" className="grid gap-3">
      <h2 id="admin-pedido-estorno" className={TITULO_SECAO}>
        Cancelamento e estorno
      </h2>
      {escolha ? (
        <div className="grid gap-3 rounded-card border-2 border-neutro-grafite p-4">
          {escolha.tipo === "cancelar" ? (
            <p>
              Cancelar o pedido? As obras voltam à vitrine e o Pix ou boleto em aberto é cancelado
              no Mercado Pago. Isso não pode ser desfeito.
            </p>
          ) : escolha.pagamento.acaoEstorno === "concluir" ? (
            <p>
              O estorno de {formatarPreco(escolha.pagamento.valorCentavos)} já foi feito no Mercado
              Pago. {efeitoNoPedido(escolha.pagamento.motivoEstorno)} Isso não pode ser desfeito.
            </p>
          ) : (
            <p>
              Estornar? {formatarPreco(escolha.pagamento.valorCentavos)} volta ao cliente pelo
              Mercado Pago. {efeitoNoPedido(escolha.pagamento.motivoEstorno)} Isso não pode ser
              desfeito.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={pendente}
              onClick={() =>
                escolha.tipo === "cancelar"
                  ? executar(() => acoes.cancelarPedido({ numero }), voltar, "Pedido cancelado.")
                  : executar(
                      () =>
                        acoes.estornarPagamento({
                          numero,
                          idExterno: escolha.pagamento.idExterno,
                        }),
                      voltar,
                      "Pagamento estornado.",
                    )
              }
            >
              {escolha.tipo === "cancelar" ? "Confirmar cancelamento" : "Confirmar estorno"}
            </Button>
            <Button type="button" variant="contorno" onClick={voltar}>
              Voltar
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {cancelavel && (
            <div>
              <Button
                type="button"
                variant="contorno"
                disabled={pendente}
                onClick={() => setEscolha({ tipo: "cancelar" })}
              >
                Cancelar pedido
              </Button>
            </div>
          )}
          {estornaveis.map((pagamento) => (
            <div key={pagamento.idExterno} className="grid gap-2">
              {pagamento.motivoEstorno && <p>{MOTIVO[pagamento.motivoEstorno]}</p>}
              <div>
                <Button
                  type="button"
                  variant="contorno"
                  disabled={pendente}
                  onClick={() => setEscolha({ tipo: "estornar", pagamento })}
                >
                  {pagamento.acaoEstorno === "concluir" ? "Concluir estorno" : "Estornar pagamento"}{" "}
                  {pagamento.idExterno}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {feedback}
    </section>
  );
}
