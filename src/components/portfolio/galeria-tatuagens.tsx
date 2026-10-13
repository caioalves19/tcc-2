import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import type { GaleriaPublica } from "@/modules/portfolio";

export function GaleriaTatuagens({
  trabalhos,
  artistas,
  estilos,
  regioes,
  filtros,
  baseImagens,
}: GaleriaPublica & { baseImagens: string | null }) {
  const base = baseImagens?.replace(/\/+$/, "");
  return (
    <>
      <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
        Galeria de tatuagens
      </h1>
      <form action="/tatuagens" method="get" className="mt-6 flex flex-wrap items-end gap-3">
        {[
          { nome: "artista", rotulo: "Artista", valor: filtros.artista, opcoes: artistas },
          { nome: "estilo", rotulo: "Estilo", valor: filtros.estilo, opcoes: estilos },
          {
            nome: "regiao",
            rotulo: "Região do corpo",
            valor: filtros.regiao,
            opcoes: regioes.map((r) => ({ id: r, nome: r })),
          },
        ].map((campo) => (
          <label key={campo.nome} className="grid w-full gap-1 sm:w-auto">
            <span className="text-nota">{campo.rotulo}</span>
            <select
              name={campo.nome}
              defaultValue={campo.valor ?? ""}
              className="h-12 max-w-full rounded-campo border-2 border-[var(--kolo-contorno)] bg-background px-3"
            >
              <option value="">Todos</option>
              {campo.valor && !campo.opcoes.some((o) => o.id === campo.valor) && (
                <option value={campo.valor}>Seleção indisponível</option>
              )}
              {campo.opcoes.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button type="submit" className={buttonVariants()}>
          Filtrar
        </button>
        <a href="/tatuagens" className={buttonVariants({ variant: "contorno" })}>
          Limpar filtros
        </a>
      </form>
      {trabalhos.length === 0 && (
        <p className="mt-8" role="status">
          {filtros.artista || filtros.estilo || filtros.regiao
            ? "Nenhum trabalho encontrado para os filtros selecionados."
            : "Ainda não há tatuagens cadastradas."}
        </p>
      )}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {trabalhos.map((t, i) => (
          <article
            key={t.id}
            className="overflow-hidden rounded-card border-2 border-neutro-grafite bg-[var(--kolo-superficie)] text-[var(--kolo-superficie-texto)] shadow-adesivo-sm"
          >
            <div className="relative aspect-[4/3] border-b-2 border-neutro-grafite">
              {base ? (
                <Image
                  src={`${base}/${t.imagem}`}
                  alt={t.textoAlternativo}
                  fill
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                  loading={i < 4 ? "eager" : "lazy"}
                  className="object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center">Imagem indisponível</div>
              )}
            </div>
            <div className="grid gap-1 p-4">
              <p className="font-display text-etiqueta uppercase text-[var(--kolo-link)]">
                {t.artistaNome}
              </p>
              <h2 className="break-words font-display text-titulo-lg uppercase">{t.titulo}</h2>
              <p className="text-nota">
                {[...t.estilos, t.regiaoCorpo].filter(Boolean).join(" · ")}
              </p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
