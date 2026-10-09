import { dataDoPedido, EtiquetaSituacao } from "@/components/conta/situacao-pedido";
import { buttonVariants } from "@/components/ui/button";
import { formatarPreco } from "@/modules/catalog/cliente";
import type { PaginaPedidosAdmin } from "@/modules/orders";
import { FILTROS_PEDIDOS, type FiltroPedidos } from "@/modules/orders/cliente";
import { classeCampo } from "./formulario";

const ROTULO_FILTRO: Record<FiltroPedidos, string> = {
  "a-fazer": "A fazer",
  pendentes: "Pendentes",
  enviados: "Prontos ou enviados",
  entregues: "Retirados ou entregues",
  cancelados: "Cancelados",
  todos: "Todos",
};

// A URL guarda filtro, busca e página; os valores padrão ficam de fora.
function hrefPedidos(filtro: FiltroPedidos, busca: string, pagina = 1): string {
  const parametros = new URLSearchParams();
  if (filtro !== "a-fazer") parametros.set("filtro", filtro);
  if (busca) parametros.set("busca", busca);
  if (pagina > 1) parametros.set("pagina", String(pagina));
  const consulta = parametros.toString();
  return consulta ? `/admin/pedidos?${consulta}` : "/admin/pedidos";
}

// RF29: pedidos para o ADMIN (listarPedidosAdmin). Filtro e busca por formulário GET, sem
// JavaScript; o detalhe de cada pedido tem as ações.
export function ListaPedidosAdmin({
  pedidos,
  total,
  pagina,
  totalPaginas,
  filtro,
  busca,
}: PaginaPedidosAdmin) {
  return (
    <>
      <h1 className="mb-6 font-display text-2xl">Pedidos</h1>
      <nav aria-label="Filtrar pedidos">
        <ul className="flex flex-wrap gap-2">
          {FILTROS_PEDIDOS.map((opcao) => (
            <li key={opcao}>
              <a
                href={hrefPedidos(opcao, busca)}
                aria-current={opcao === filtro ? "page" : undefined}
                className={buttonVariants({
                  variant: opcao === filtro ? "default" : "contorno",
                  size: "sm",
                })}
              >
                {ROTULO_FILTRO[opcao]}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <form
        role="search"
        action="/admin/pedidos"
        className="mt-6 flex max-w-xl flex-wrap items-end gap-3"
      >
        <input type="hidden" name="filtro" value={filtro} />
        <div className="grid min-w-0 flex-1 gap-2">
          <label htmlFor="busca" className="text-nota font-semibold">
            Buscar por número ou e-mail
          </label>
          <input
            id="busca"
            name="busca"
            type="search"
            defaultValue={busca}
            maxLength={100}
            className={classeCampo}
          />
        </div>
        <button type="submit" className={buttonVariants({ variant: "contorno" })}>
          Buscar
        </button>
      </form>

      {pedidos.length === 0 ? (
        <p className="mt-8">Nenhum pedido encontrado.</p>
      ) : (
        <>
          <p className="mt-6 text-nota">{total === 1 ? "1 pedido" : `${total} pedidos`}</p>
          <ul aria-label="Lista de pedidos" className="mt-3 grid gap-3">
            {pedidos.map((pedido) => (
              <li
                key={pedido.numero}
                className="relative grid gap-2 rounded-card border-2 border-neutro-grafite bg-[var(--kolo-superficie)] p-4 text-[var(--kolo-superficie-texto)] focus-within:ring-3 focus-within:ring-ring/50 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="grid min-w-0 gap-1">
                  <h2 className="break-words font-display text-lg">
                    <a
                      href={`/admin/pedidos/${pedido.numero}`}
                      className="after:absolute after:inset-0 focus-visible:outline-none"
                    >
                      Pedido {pedido.numero}
                    </a>
                  </h2>
                  <p className="break-words">
                    {pedido.cliente.nome} · {pedido.cliente.email}
                  </p>
                  <p className="text-nota">
                    {dataDoPedido(pedido.criadoEm)} ·{" "}
                    {pedido.unidades === 1 ? "1 item" : `${pedido.unidades} itens`}
                  </p>
                </div>
                <div className="grid justify-items-start gap-2 sm:justify-items-end">
                  <EtiquetaSituacao situacao={pedido.situacao} modalidade={pedido.modalidade} />
                  <p className="font-display">{formatarPreco(pedido.totalCentavos)}</p>
                </div>
              </li>
            ))}
          </ul>
          {totalPaginas > 1 && (
            <nav aria-label="Paginação" className="mt-6 flex flex-wrap items-center gap-4">
              {pagina > 1 && (
                <a href={hrefPedidos(filtro, busca, pagina - 1)} className="underline">
                  Anterior
                </a>
              )}
              <span>
                Página {pagina} de {totalPaginas}
              </span>
              {pagina < totalPaginas && (
                <a href={hrefPedidos(filtro, busca, pagina + 1)} className="underline">
                  Próxima
                </a>
              )}
            </nav>
          )}
        </>
      )}
    </>
  );
}
