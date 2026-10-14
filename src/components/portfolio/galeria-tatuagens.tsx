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
  // RF18 (PBI-37): com busca ou filtro ativo, mostra a contagem e o caminho para limpar tudo.
  const filtrado = Boolean(filtros.artista || filtros.estilo || filtros.regiao);
  const ativo = filtrado || Boolean(filtros.busca);
  const vazio = filtros.busca
    ? `Nenhum trabalho encontrado para “${filtros.busca}”${filtrado ? " com os filtros selecionados" : ""}.`
    : "Nenhum trabalho encontrado para os filtros selecionados.";
  return (
    <>
      <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
        Galeria de tatuagens
      </h1>
      <form action="/tatuagens" method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="grid w-full gap-1 sm:w-72">
          <span className="text-nota">Buscar por palavra-chave</span>
          <input
            type="search"
            name="busca"
            defaultValue={filtros.busca}
            maxLength={100}
            placeholder="Estilo, elemento ou tatuador"
            className="h-12 max-w-full rounded-campo border-2 border-[var(--kolo-contorno)] bg-background px-3"
          />
        </label>
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
        {ativo && (
          <a href="/tatuagens" className={buttonVariants({ variant: "contorno" })}>
            Limpar busca e filtros
          </a>
        )}
      </form>
      {trabalhos.length === 0 ? (
        <p className="mt-8" role="status">
          {ativo ? vazio : "Ainda não há tatuagens cadastradas."}
        </p>
      ) : (
        ativo && (
          <p className="mt-6 text-nota" role="status">
            {trabalhos.length === 1
              ? "1 trabalho encontrado"
              : `${trabalhos.length} trabalhos encontrados`}
          </p>
        )
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
