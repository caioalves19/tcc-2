"use client";

import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatarPreco } from "@/modules/catalog/cliente";
import type { PedidoResumo, SituacaoPedido } from "@/modules/orders";

const SITUACAO: Record<SituacaoPedido, string> = {
  PENDENTE: "Aguardando pagamento",
  PAGO: "Pago",
  PROCESSANDO: "Em preparação",
  ENVIADO: "Enviado",
  ENTREGUE: "Entregue",
  CANCELADO: "Pedido cancelado",
};

function restanteDe(expiraEm: Date | null): number {
  return expiraEm ? Math.max(0, expiraEm.getTime() - Date.now()) : 0;
}

function mmss(ms: number): string {
  const segundos = Math.ceil(ms / 1000);
  const minutos = Math.floor(segundos / 60);
  return `${String(minutos).padStart(2, "0")}:${String(segundos % 60).padStart(2, "0")}`;
}

// RN03: as unidades ficam presas por 10 minutos. O cronômetro só informa; quem solta a
// reserva é o servidor (PBI-25), não esta tela.
export function PedidoCheckout({ pedido }: { pedido: PedidoResumo }) {
  const [restante, setRestante] = useState(() => restanteDe(pedido.reservaExpiraEm));
  const pendente = pedido.situacao === "PENDENTE";

  useEffect(() => {
    if (!pendente || !pedido.reservaExpiraEm) return;
    const relogio = setInterval(() => setRestante(restanteDe(pedido.reservaExpiraEm)), 1000);
    return () => clearInterval(relogio);
  }, [pendente, pedido.reservaExpiraEm]);

  const { endereco } = pedido;
  return (
    <>
      <p className="font-display text-selo uppercase">{SITUACAO[pedido.situacao]}</p>
      <h1 className="mt-2 break-words font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
        Pedido {pedido.numero}
      </h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="grid content-start gap-6">
          {pendente && restante > 0 && (
            <div
              role="timer"
              aria-live="off"
              className="rounded-card border-2 border-neutro-grafite bg-primary p-5 text-primary-foreground shadow-adesivo-sm"
            >
              <p className="font-display uppercase">
                Suas obras estão reservadas por{" "}
                <span suppressHydrationWarning className="text-titulo-lg">
                  {mmss(restante)}
                </span>
              </p>
              <p className="mt-2">
                Conclua o pagamento antes do fim do prazo; depois disso, as obras voltam à vitrine.
              </p>
            </div>
          )}
          {pendente && restante === 0 && (
            <div role="status" className="grid gap-3 rounded-card border-2 border-destructive p-5">
              <p className="font-display uppercase text-destructive">A reserva expirou</p>
              <p>As obras voltaram a ficar disponíveis. Finalize de novo pelo carrinho.</p>
              <div>
                <a href="/carrinho" className={buttonVariants({ variant: "contorno", size: "sm" })}>
                  Voltar ao carrinho
                </a>
              </div>
            </div>
          )}
          <section aria-labelledby="pedido-endereco" className="grid gap-2">
            <h2 id="pedido-endereco" className="font-display text-titulo-lg uppercase">
              Endereço do pedido
            </h2>
            <address className="grid gap-1 not-italic">
              <strong>{endereco.destinatario}</strong>
              <span>
                {endereco.logradouro}, {endereco.numero}
                {endereco.complemento && ` — ${endereco.complemento}`}
              </span>
              <span>
                {endereco.bairro}, {endereco.cidade} / {endereco.uf} · CEP {endereco.cep}
              </span>
            </address>
          </section>
        </div>

        <aside
          aria-labelledby="pedido-resumo"
          className="grid content-start gap-4 rounded-card border-2 border-neutro-grafite p-5"
        >
          <h2 id="pedido-resumo" className="font-display text-titulo-lg uppercase">
            Resumo do pedido
          </h2>
          <ul className="grid gap-2">
            {pedido.itens.map((item) => (
              <li key={item.obraId} className="flex justify-between gap-4">
                <span className="min-w-0 break-words">{item.titulo}</span>
                <span className="shrink-0">
                  {formatarPreco(item.precoCentavos)}
                  {item.quantidade > 1 && ` × ${item.quantidade}`}
                </span>
              </li>
            ))}
          </ul>
          <dl className="grid gap-2 border-t-2 border-neutro-grafite pt-3">
            <div className="flex justify-between gap-4">
              <dt>Subtotal</dt>
              <dd>{formatarPreco(pedido.subtotalCentavos)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Retirada no ateliê</dt>
              <dd>{formatarPreco(pedido.freteCentavos)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t-2 border-neutro-grafite pt-2 font-display text-titulo-lg">
              <dt>Total</dt>
              <dd>{formatarPreco(pedido.totalCentavos)}</dd>
            </div>
          </dl>
          {pendente && restante > 0 && (
            <>
              {/* O Checkout Pro do Mercado Pago entra no PBI-27. */}
              <Button type="button" size="lg" disabled>
                Pagar com Mercado Pago
              </Button>
              <p className="text-nota">O pagamento online estará disponível em breve.</p>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
