import { formatarPreco } from "@/modules/catalog/cliente";
import type { PedidoDetalhado } from "@/modules/orders";

// Partes do pedido iguais na conta do cliente (PBI-29) e no admin (PBI-30). Itens, valores e
// endereço são as cópias gravadas no checkout (PBI-26).

const MODALIDADE: Record<PedidoDetalhado["modalidade"], string> = {
  RETIRADA: "Retirada no ateliê",
};

export const TITULO_SECAO = "font-display text-titulo-lg uppercase";

export function EntregaPedido({
  pedido,
}: {
  pedido: Pick<PedidoDetalhado, "modalidade" | "endereco">;
}) {
  const { endereco } = pedido;
  return (
    <section aria-labelledby="pedido-entrega" className="grid content-start gap-3">
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
  );
}

export function ResumoPedido({
  pedido,
}: {
  pedido: Pick<
    PedidoDetalhado,
    "modalidade" | "itens" | "subtotalCentavos" | "freteCentavos" | "totalCentavos"
  >;
}) {
  return (
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
  );
}
