import { dataDoPedido } from "@/components/conta/situacao-pedido";
import { buttonVariants } from "@/components/ui/button";
import type { PaginaClientesAdmin } from "@/modules/customers";
import { classeCampo } from "./formulario";

// A URL guarda busca e página; os valores padrão ficam de fora.
function hrefClientes(busca: string, pagina = 1): string {
  const parametros = new URLSearchParams();
  if (busca) parametros.set("busca", busca);
  if (pagina > 1) parametros.set("pagina", String(pagina));
  const consulta = parametros.toString();
  return consulta ? `/admin/clientes?${consulta}` : "/admin/clientes";
}

// RF30 (PBI-38): clientes para o ADMIN (listarClientesAdmin). Busca por formulário GET, sem
// JavaScript; o perfil de cada cliente tem os dados e o histórico de compras.
export function ListaClientesAdmin({
  clientes,
  total,
  pagina,
  totalPaginas,
  busca,
}: PaginaClientesAdmin) {
  return (
    <>
      <h1 className="mb-6 font-display text-2xl">Clientes</h1>

      <form
        role="search"
        action="/admin/clientes"
        className="flex max-w-xl flex-wrap items-end gap-3"
      >
        <div className="grid min-w-0 flex-1 gap-2">
          <label htmlFor="busca" className="text-nota font-semibold">
            Buscar por nome ou e-mail
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

      {clientes.length === 0 ? (
        <p className="mt-8">Nenhum cliente encontrado.</p>
      ) : (
        <>
          <p className="mt-6 text-nota">{total === 1 ? "1 cliente" : `${total} clientes`}</p>
          <ul aria-label="Lista de clientes" className="mt-3 grid gap-3">
            {clientes.map((cliente) => (
              <li
                key={cliente.id}
                className="relative grid gap-2 rounded-card border-2 border-neutro-grafite bg-[var(--kolo-superficie)] p-4 text-[var(--kolo-superficie-texto)] focus-within:ring-3 focus-within:ring-ring/50 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="grid min-w-0 gap-1">
                  <h2 className="break-words font-display text-lg">
                    <a
                      href={`/admin/clientes/${cliente.id}`}
                      className="after:absolute after:inset-0 focus-visible:outline-none"
                    >
                      {cliente.nome}
                    </a>
                  </h2>
                  <p className="break-all">{cliente.email}</p>
                  <p className="text-nota">Cliente desde {dataDoPedido(cliente.cadastradoEm)}</p>
                </div>
                {cliente.excluido && (
                  <span className="inline-block justify-self-start rounded-campo border-2 border-neutro-grafite bg-[var(--kolo-erro-fundo)] px-2 py-1 font-display text-etiqueta uppercase text-[var(--kolo-erro-texto)] sm:justify-self-end">
                    Conta excluída
                  </span>
                )}
              </li>
            ))}
          </ul>
          {totalPaginas > 1 && (
            <nav aria-label="Paginação" className="mt-6 flex flex-wrap items-center gap-4">
              {pagina > 1 && (
                <a href={hrefClientes(busca, pagina - 1)} className="underline">
                  Anterior
                </a>
              )}
              <span>
                Página {pagina} de {totalPaginas}
              </span>
              {pagina < totalPaginas && (
                <a href={hrefClientes(busca, pagina + 1)} className="underline">
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
