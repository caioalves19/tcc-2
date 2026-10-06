import { cn } from "cn";

import { buttonVariants } from "@/components/ui/button";
import { CONTATO } from "@/lib/contato";

// Documento de política (RF08): privacidade, termos e cancelamento usam o mesmo desenho.
// O conteúdo é dado puro (serializável em JSON) para o PBI-39 levá-lo ao site_setting.

const POLITICAS = [
  { slug: "privacidade", rotulo: "Privacidade", href: "/politicas/privacidade" },
  { slug: "termos", rotulo: "Termos de uso", href: "/politicas/termos" },
  { slug: "cancelamento", rotulo: "Política de cancelamento", href: "/politicas/cancelamento" },
] as const;

export type BlocoPolitica = string | { readonly itens: readonly string[] };

export type SecaoPolitica = {
  readonly id: string;
  readonly titulo: string;
  readonly blocos: readonly BlocoPolitica[];
};

export type Politica = {
  readonly slug: (typeof POLITICAS)[number]["slug"];
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
          <nav aria-labelledby="todas-as-politicas">
            <p
              id="todas-as-politicas"
              className="font-display text-etiqueta uppercase text-[var(--kolo-texto-suave)]"
            >
              Todas as políticas
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {POLITICAS.map((item) => {
                const atual = item.slug === politica.slug;
                return (
                  <li key={item.slug}>
                    <a
                      href={item.href}
                      aria-current={atual ? "page" : undefined}
                      className={cn(
                        "block border-l-4 py-1 pl-3",
                        atual
                          ? "border-[var(--kolo-texto)] font-semibold"
                          : "border-transparent text-[var(--kolo-link)] underline-offset-4 hover:underline",
                      )}
                    >
                      {item.rotulo}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

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

        {/* Depois do texto no celular; embaixo dos índices no desktop. */}
        <aside
          aria-labelledby="duvidas"
          className="rounded-card border-2 border-neutro-grafite bg-[var(--kolo-superficie)] p-5 text-[var(--kolo-superficie-texto)] shadow-adesivo-sm md:col-start-1 md:row-start-2 md:self-start"
        >
          <h2 id="duvidas" className="font-display text-titulo-sm">
            Dúvidas?
          </h2>
          <p className="mt-2 text-nota">Fale com a gente pelo WhatsApp ou por e-mail.</p>
          <div className="mt-4 flex flex-col gap-3">
            <a href={CONTATO.whatsapp} className={buttonVariants({ size: "sm" })}>
              Falar no WhatsApp
            </a>
            <a
              href={`mailto:${CONTATO.email}`}
              className={buttonVariants({ size: "sm", variant: "contorno" })}
            >
              {CONTATO.email}
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
