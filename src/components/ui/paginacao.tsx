const LINK_PAGINA =
  "grid h-12 min-w-12 place-items-center rounded-campo border-2 border-neutro-grafite px-3 font-display";

type Props = {
  caminho: string;
  parametros?: Record<string, string | undefined>;
  pagina: number;
  totalPaginas: number;
};

// A URL guarda filtros e página, para o link poder ser compartilhado; a página 1 fica de fora.
function hrefPagina(caminho: string, parametros: Props["parametros"] = {}, pagina: number): string {
  const consulta = new URLSearchParams();
  for (const [nome, valor] of Object.entries(parametros)) {
    if (valor) consulta.set(nome, valor);
  }
  if (pagina > 1) consulta.set("pagina", String(pagina));
  const texto = consulta.toString();
  return texto ? `${caminho}?${texto}` : caminho;
}

export function Paginacao({ caminho, parametros, pagina, totalPaginas }: Props) {
  if (totalPaginas <= 1) return null;
  const href = (numero: number) => hrefPagina(caminho, parametros, numero);
  return (
    <nav aria-label="Paginação" className="mt-10">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {pagina > 1 && (
          <li>
            <a href={href(pagina - 1)} className={LINK_PAGINA}>
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
              <a href={href(numero)} className={LINK_PAGINA}>
                {numero}
              </a>
            )}
          </li>
        ))}
        {pagina < totalPaginas && (
          <li>
            <a href={href(pagina + 1)} className={LINK_PAGINA}>
              Próxima
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}
