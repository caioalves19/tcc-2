import Image from "next/image";
import type { CardObra as DadosCard } from "@/modules/catalog";
import { formatarPreco } from "@/modules/catalog/cliente";

// Card da vitrine (PBI-20, "Outras obras do artista"); o catálogo (PBI-19) pode reaproveitar.
// O cartão inteiro é clicável pelo link do título, sem link aninhado.
export function CardObra({ obra, baseImagens }: { obra: DadosCard; baseImagens: string | null }) {
  const base = baseImagens?.replace(/\/+$/, "") ?? null;
  const ficha = [obra.dimensoes, obra.tecnica].filter(Boolean).join(" · ");
  return (
    <article className="relative grid overflow-hidden rounded-card border-2 border-neutro-grafite bg-[var(--kolo-superficie)] text-[var(--kolo-superficie-texto)] shadow-adesivo-sm focus-within:ring-3 focus-within:ring-ring/50">
      <div className="relative aspect-[4/3] border-b-2 border-neutro-grafite">
        {base && obra.imagem ? (
          <Image
            src={`${base}/${obra.imagem.chave}`}
            alt={obra.imagem.textoAlternativo}
            fill
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
            className={`object-cover ${obra.disponivel ? "" : "opacity-60 grayscale"}`}
          />
        ) : (
          <div className="grid h-full place-items-center text-nota">Sem foto</div>
        )}
        {!obra.disponivel && (
          <span className="absolute left-3 top-3 rounded-campo border-2 border-neutro-grafite bg-[var(--kolo-erro-fundo)] px-2 py-1 font-display text-etiqueta uppercase text-[var(--kolo-erro-texto)]">
            Esgotada
          </span>
        )}
      </div>
      <div className="grid gap-1 p-4">
        <h3 className="break-words font-display text-titulo-lg uppercase">
          <a
            href={`/obras/${obra.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {obra.titulo}
          </a>
        </h3>
        {ficha && <p className="text-nota">{ficha}</p>}
        <p className={`font-display text-preco ${obra.disponivel ? "" : "text-nota line-through"}`}>
          {formatarPreco(obra.precoCentavos)}
        </p>
      </div>
    </article>
  );
}
