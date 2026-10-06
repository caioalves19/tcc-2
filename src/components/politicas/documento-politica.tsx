// Documento de política (RF08): privacidade, termos e cancelamento usam o mesmo desenho.
// O conteúdo é dado puro (serializável em JSON) para o PBI-39 levá-lo ao site_setting.

export type BlocoPolitica = string | { readonly itens: readonly string[] };

export type SecaoPolitica = {
  readonly id: string;
  readonly titulo: string;
  readonly blocos: readonly BlocoPolitica[];
};

export type Politica = {
  readonly slug: "privacidade" | "termos" | "cancelamento";
  readonly titulo: string;
  readonly resumo: string;
  // AAAA-MM-DD. Formatada sem Date: new Date("2026-10-05") em São Paulo vira dia 4.
  readonly atualizadaEm: string;
  readonly secoes: readonly SecaoPolitica[];
};

function dataBrasileira(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function Bloco({ bloco }: { readonly bloco: BlocoPolitica }) {
  if (typeof bloco === "string") return <p>{bloco}</p>;
  return (
    <ul className="list-disc space-y-2 pl-6">
      {bloco.itens.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function DocumentoPolitica({ politica }: { readonly politica: Politica }) {
  return (
    <div className="mx-auto max-w-pagina px-margem py-12 md:px-margem-desktop md:py-16">
      <header className="max-w-3xl">
        <p className="font-display text-etiqueta uppercase text-[var(--kolo-link)]">Políticas</p>
        <h1 className="mt-3 font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
          {politica.titulo}
        </h1>
        <p className="mt-4 text-corpo-lg text-[var(--kolo-texto-suave)]">{politica.resumo}</p>
        <p className="mt-3 text-nota text-[var(--kolo-texto-suave)]">
          Atualizada em{" "}
          <time dateTime={politica.atualizadaEm}>{dataBrasileira(politica.atualizadaEm)}</time>
        </p>
      </header>

      <div className="mt-10 grid gap-10 md:grid-cols-[15rem_minmax(0,1fr)] md:grid-rows-[auto_1fr] md:gap-x-12">
        <div className="flex flex-col gap-8 md:col-start-1 md:row-start-1">
          <nav aria-labelledby="indice-da-pagina">
            <p
              id="indice-da-pagina"
              className="font-display text-etiqueta uppercase text-[var(--kolo-texto-suave)]"
            >
              Nesta página
            </p>
            <ol className="mt-3 flex flex-col gap-2 text-nota">
              {politica.secoes.map((secao) => (
                <li key={secao.id}>
                  <a
                    href={`#${secao.id}`}
                    className="text-[var(--kolo-link)] underline-offset-4 hover:underline"
                  >
                    {secao.titulo}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <article className="flex max-w-[70ch] flex-col gap-10 md:col-start-2 md:row-span-2 md:row-start-1">
          {politica.secoes.map((secao) => (
            <section key={secao.id}>
              {/* scroll-mt: a âncora para abaixo do cabeçalho fixo (h-20). */}
              <h2 id={secao.id} className="scroll-mt-28 font-display text-titulo-lg">
                {secao.titulo}
              </h2>
              <div className="mt-4 flex flex-col gap-4 text-corpo">
                {secao.blocos.map((bloco, indice) => (
                  <Bloco key={indice} bloco={bloco} />
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
