"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ResultadoGestao } from "@/modules/artists";
import type { PedidoAdmin } from "@/modules/orders";
import {
  aceitaRastreio,
  proximasSituacoes,
  rotuloDoAndamento,
  type SituacaoDoAndamento,
} from "@/modules/orders/cliente";
import { classeCampo, texto, useGestao } from "./formulario";

type Props = {
  numero: string;
  situacao: PedidoAdmin["situacaoBanco"];
  modalidade: PedidoAdmin["modalidade"];
  rastreio: string | null;
  // Server Actions num objeto: uma função comum não atravessa a fronteira servidor/cliente.
  acoes: {
    mudarSituacao: (entrada: {
      numero: string;
      de: PedidoAdmin["situacaoBanco"];
      para: SituacaoDoAndamento;
    }) => Promise<ResultadoGestao<unknown>>;
    registrarRastreio: (entrada: {
      numero: string;
      codigo: string;
    }) => Promise<ResultadoGestao<unknown>>;
  };
};

const SEM_MUDANCA: Partial<Record<PedidoAdmin["situacaoBanco"], string>> = {
  PENDENTE:
    "A situação muda sozinha quando o pagamento for aprovado pelo Mercado Pago. Não dá para marcar como pago por aqui.",
  CANCELADO: "Pedido cancelado.",
  ENTREGUE: "Pedido concluído.",
};

// RF29: o admin só avança a situação (sem voltar) e registra o rastreio depois do pagamento.
// Como a mudança não volta atrás, cada uma pede confirmação.
export function AcoesPedido({ numero, situacao, modalidade, rastreio, acoes }: Props) {
  const { pendente, executar, feedback } = useGestao();
  const [escolhida, setEscolhida] = useState<SituacaoDoAndamento | null>(null);
  const proximas = proximasSituacoes(situacao);

  return (
    <div className="grid gap-6">
      <section aria-labelledby="admin-pedido-situacao" className="grid gap-3">
        <h2 id="admin-pedido-situacao" className="font-display text-xl">
          Mudar situação
        </h2>
        {proximas.length === 0 ? (
          <p>{SEM_MUDANCA[situacao]}</p>
        ) : escolhida ? (
          <div className="grid gap-3 rounded-card border-2 border-neutro-grafite p-4">
            <p>
              Marcar como <strong>{rotuloDoAndamento(escolhida, modalidade)}</strong>? Esta mudança
              não pode ser desfeita.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                disabled={pendente}
                onClick={() =>
                  executar(
                    () => acoes.mudarSituacao({ numero, de: situacao, para: escolhida }),
                    () => setEscolhida(null),
                    "Situação atualizada.",
                  )
                }
              >
                Confirmar
              </Button>
              <Button type="button" variant="contorno" onClick={() => setEscolhida(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {proximas.map((para) => (
              <Button
                key={para}
                type="button"
                variant="contorno"
                disabled={pendente}
                onClick={() => setEscolhida(para)}
              >
                Marcar como {rotuloDoAndamento(para, modalidade)}
              </Button>
            ))}
          </div>
        )}
      </section>

      {aceitaRastreio(situacao) && (
        <section aria-labelledby="admin-pedido-rastreio" className="grid gap-3">
          <h2 id="admin-pedido-rastreio" className="font-display text-xl">
            Rastreio
          </h2>
          <form
            className="grid max-w-md gap-2"
            onSubmit={(evento) => {
              evento.preventDefault();
              const codigo = texto(new FormData(evento.currentTarget), "codigo");
              void executar(
                () => acoes.registrarRastreio({ numero, codigo }),
                () => undefined,
                "Rastreio salvo.",
              );
            }}
          >
            <label htmlFor="codigo" className="text-nota font-semibold">
              Código de rastreio
            </label>
            <input
              id="codigo"
              name="codigo"
              defaultValue={rastreio ?? ""}
              maxLength={40}
              aria-describedby="codigo-dica"
              className={classeCampo}
            />
            <p id="codigo-dica" className="text-nota">
              Letras, números ou hífen. Deixe em branco para remover.
            </p>
            <div>
              <Button type="submit" disabled={pendente}>
                Salvar rastreio
              </Button>
            </div>
          </form>
        </section>
      )}
      {feedback}
    </div>
  );
}
