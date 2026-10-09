import { ArrowLeft, Check } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { CopiarCodigo } from "@/components/conta/copiar-codigo";
import { dataDoPedido, EtiquetaSituacao } from "@/components/conta/situacao-pedido";
import { formatarPreco } from "@/modules/catalog/cliente";
import type { PedidoDetalhado } from "@/modules/orders";
import { rotuloSituacao, type SituacaoCliente } from "@/modules/orders/cliente";

const MODALIDADE: Record<PedidoDetalhado["modalidade"], string> = {
  RETIRADA: "Retirada no ateliê",
};

// Posição de cada situação no andamento; o cancelado não entra (mostra um aviso no lugar).
const POSICAO: Record<Exclude<SituacaoCliente, "CANCELADO">, number> = {
  AGUARDANDO_PAGAMENTO: 0,
  PAGO: 1,
  EM_PREPARACAO: 2,
  ENVIADO: 3,
  ENTREGUE: 4,
};

// As datas que o pedido guarda: feito, pago e enviado. Preparação e entrega não têm data no banco.
function passosDo(pedido: PedidoDetalhado) {
  return [
    { rotulo: "Pedido feito", data: pedido.criadoEm },
    { rotulo: "Pago", data: pedido.pagoEm },
    { rotulo: "Em preparação", data: null },
    { rotulo: rotuloSituacao("ENVIADO", pedido.modalidade), data: pedido.enviadoEm },
    { rotulo: rotuloSituacao("ENTREGUE", pedido.modalidade), data: null },
  ];
}

const SECAO = "grid content-start gap-3";
const TITULO_SECAO = "font-display text-titulo-lg uppercase";

// RF16: detalhe do pedido para o dono (lerMeuPedido). Itens e valores são as cópias do checkout.
export function DetalhePedido({ pedido }: { pedido: PedidoDetalhado }) {
  const { endereco } = pedido;
  const atual = pedido.situacao === "CANCELADO" ? null : POSICAO[pedido.situacao];
  return (
    <>
      <a
        href="/conta/pedidos"
        className="inline-flex items-center gap-1 text-[var(--kolo-link)] underline underline-offset-4"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Meus pedidos
      </a>
      <div className="mt-6">
        <EtiquetaSituacao situacao={pedido.situacao} modalidade={pedido.modalidade} />
      </div>
      <h1 className="mt-3 break-words font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
        Pedido {pedido.numero}
      </h1>
      <p className="mt-2 text-nota">Feito em {dataDoPedido(pedido.criadoEm)}</p>

      {pedido.situacao === "AGUARDANDO_PAGAMENTO" && (
        <div className="mt-6 grid justify-items-start gap-3 rounded-card border-2 border-neutro-grafite bg-[var(--kolo-superficie)] p-5 text-[var(--kolo-superficie-texto)] shadow-adesivo-sm">
          <p>O pagamento deste pedido ainda não foi aprovado.</p>
          <a href={`/checkout/${pedido.numero}`} className={buttonVariants()}>
            Ir para o pagamento
          </a>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="grid content-start gap-8">
          {atual === null && (
            <p className="rounded-card border-2 border-[var(--kolo-erro)] p-5">
              Este pedido foi cancelado. Se houve cobrança, o reembolso segue a{" "}
              <a
                href="/politicas/cancelamento"
                className="text-[var(--kolo-link)] underline underline-offset-4"
              >
                política de cancelamento
              </a>
              .
            </p>
          )}
          {atual !== null && (
            <section aria-labelledby="pedido-andamento" className={SECAO}>
              <h2 id="pedido-andamento" className={TITULO_SECAO}>
                Andamento
              </h2>
              <ol aria-label="Andamento do pedido" className="grid gap-2 sm:grid-cols-5">
                {passosDo(pedido).map((passo, indice) => {
                  const feito = indice <= atual;
                  return (
                    <li
                      key={passo.rotulo}
                      aria-current={indice === atual ? "step" : undefined}
                      className={`grid content-start gap-1 rounded-card border-2 p-3 ${
                        indice === atual
                          ? "border-neutro-grafite bg-[var(--kolo-acao)] text-[var(--kolo-acao-texto)]"
                          : feito
                            ? "border-neutro-grafite"
                            : "border-dashed border-[var(--kolo-borda-campo)] text-[var(--kolo-texto-suave)]"
                      }`}
                    >
                      <span className="flex items-start gap-1 font-display">
                        {feito && <Check aria-hidden className="mt-1 size-4 shrink-0" />}
                        {passo.rotulo}
                      </span>
                      {passo.data && feito && (
                        <span className="text-nota">{dataDoPedido(passo.data)}</span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {pedido.rastreio && (
            <section aria-labelledby="pedido-rastreio" className={SECAO}>
              <h2 id="pedido-rastreio" className={TITULO_SECAO}>
                Código de rastreio
              </h2>
              <CopiarCodigo codigo={pedido.rastreio} />
            </section>
          )}

          <section aria-labelledby="pedido-entrega" className={SECAO}>
            <h2 id="pedido-entrega" className={TITULO_SECAO}>
              Entrega
            </h2>
            <p>{MODALIDADE[pedido.modalidade]}</p>
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

        <section
          aria-labelledby="pedido-resumo"
          className="grid content-start gap-4 self-start rounded-card border-2 border-neutro-grafite p-5"
        >
          <h2 id="pedido-resumo" className={TITULO_SECAO}>
            Resumo do pedido
          </h2>
          <ul className="grid gap-2">
            {pedido.itens.map((item, indice) => (
              <li key={`${indice}-${item.titulo}`} className="flex justify-between gap-4">
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
              <dt>{MODALIDADE[pedido.modalidade]}</dt>
              <dd>{formatarPreco(pedido.freteCentavos)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t-2 border-neutro-grafite pt-2 font-display text-titulo-lg">
              <dt>Total</dt>
              <dd>{formatarPreco(pedido.totalCentavos)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </>
  );
}
