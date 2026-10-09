import { buttonVariants } from "@/components/ui/button";
import { dataDoPedido, EtiquetaSituacao } from "@/components/conta/situacao-pedido";
import { formatarPreco } from "@/modules/catalog/cliente";
import type { PedidoDaLista } from "@/modules/orders";

// RF16: pedidos do cliente, do mais recente ao mais antigo (listarMeusPedidos). O cartão inteiro
// leva ao detalhe pelo link do número, sem link aninhado.
export function ListaPedidos({ pedidos }: { pedidos: PedidoDaLista[] }) {
  return (
    <>
      <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
        Meus pedidos
      </h1>
      {pedidos.length === 0 ? (
        <div className="mt-8 grid max-w-md justify-items-start gap-4">
          <p>Você ainda não tem pedidos.</p>
          <a href="/obras" className={buttonVariants()}>
            Ver obras
          </a>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4">
          {pedidos.map((pedido) => (
            <li
              key={pedido.numero}
              className="relative grid gap-3 rounded-card border-2 border-neutro-grafite bg-[var(--kolo-superficie)] p-5 text-[var(--kolo-superficie-texto)] shadow-adesivo-sm focus-within:ring-3 focus-within:ring-ring/50 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="grid gap-2">
                <h2 className="break-words font-display text-titulo-lg">
                  <a
                    href={`/conta/pedidos/${pedido.numero}`}
                    className="after:absolute after:inset-0 focus-visible:outline-none"
                  >
                    Pedido {pedido.numero}
                  </a>
                </h2>
                <p className="text-nota">
                  {dataDoPedido(pedido.criadoEm)} ·{" "}
                  {pedido.unidades === 1 ? "1 item" : `${pedido.unidades} itens`}
                </p>
              </div>
              <div className="grid justify-items-start gap-2 sm:justify-items-end">
                <EtiquetaSituacao situacao={pedido.situacao} />
                <p className="font-display text-preco">{formatarPreco(pedido.totalCentavos)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
