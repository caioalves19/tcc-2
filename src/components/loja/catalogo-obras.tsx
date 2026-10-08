import { buttonVariants } from "@/components/ui/button";
import { CardObra } from "@/components/loja/card-obra";
import { SeletorOrdem } from "@/components/loja/seletor-ordem";
import type { PaginaCatalogo } from "@/modules/catalog";
import { hrefCatalogo, OBRAS_POR_PAGINA } from "@/modules/catalog/cliente";

type Props = PaginaCatalogo & {
  // URL pública do R2 (R2_PUBLIC_URL); sem ela, as fotos viram espaço reservado.
  baseImagens: string | null;
};

const LINK_PAGINA =
  "grid h-12 min-w-12 place-items-center rounded-campo border-2 border-neutro-grafite px-3 font-display";

// RF09: grade pública de obras. Tudo chega pronto do servidor (listarCatalogo); a URL guarda a
// página e a ordenação, para o link poder ser compartilhado.
export function CatalogoObras({ obras, total, pagina, totalPaginas, ordem, baseImagens }: Props) {
  const inicio = (pagina - 1) * OBRAS_POR_PAGINA + 1;
  const fim = inicio + obras.length - 1;
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
          Catálogo de obras
        </h1>
        {total > 0 && <SeletorOrdem ordem={ordem} />}
      </div>

      {total === 0 ? (
        <p className="mt-8">Ainda não há obras publicadas.</p>
      ) : obras.length === 0 ? (
        <div className="mt-8 grid max-w-md gap-4">
          <p>Esta página não tem obras.</p>
          <a href={hrefCatalogo(ordem)} className={buttonVariants({ variant: "contorno" })}>
            Ir para a primeira página
          </a>
        </div>
      ) : (
        <>
          <p className="mt-4 text-nota">
            Mostrando {inicio} a {fim} de {total} obras
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {obras.map((obra) => (
              <CardObra key={obra.slug} obra={obra} baseImagens={baseImagens} />
            ))}
          </div>
          {totalPaginas > 1 && (
            <nav aria-label="Paginação" className="mt-10">
              <ul className="flex flex-wrap items-center justify-center gap-2">
                {pagina > 1 && (
                  <li>
                    <a href={hrefCatalogo(ordem, pagina - 1)} className={LINK_PAGINA}>
                      Anterior
                    </a>
                  </li>
                )}
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((numero) => (
                  <li key={numero}>
                    {numero === pagina ? (
                      <span
                        aria-current="page"
                        className={`${LINK_PAGINA} bg-primary text-primary-foreground`}
                      >
                        {numero}
                      </span>
                    ) : (
                      <a href={hrefCatalogo(ordem, numero)} className={LINK_PAGINA}>
                        {numero}
                      </a>
                    )}
                  </li>
                ))}
                {pagina < totalPaginas && (
                  <li>
                    <a href={hrefCatalogo(ordem, pagina + 1)} className={LINK_PAGINA}>
                      Próxima
                    </a>
                  </li>
                )}
              </ul>
            </nav>
          )}
        </>
      )}
    </>
  );
}
