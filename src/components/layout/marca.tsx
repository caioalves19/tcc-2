// Lockup da marca em texto (PBI-10).
// Os arquivos vetoriais ainda não existem: ver a pendência na seção 7 de
// docs/IDENTIDADE-VISUAL.md. Quando chegarem, troque o texto pelo SVG.
import { cn } from "cn";

type MarcaProps = {
  readonly marca?: "atelie" | "tattoo";
  readonly className?: string;
};

export function Marca({ marca = "atelie", className }: MarcaProps) {
  if (marca === "tattoo") {
    return (
      <span className={cn("flex flex-col leading-none", className)}>
        <span className="font-display text-titulo-lg text-[var(--kolo-acao)]">KOLÔ</span>
        <span className="font-display text-etiqueta text-[var(--kolo-texto)]">TATTOO</span>
      </span>
    );
  }

  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="rounded-campo border-2 border-neutro-grafite bg-atelie-amarelo px-2 py-1 font-display text-titulo-sm text-neutro-grafite shadow-adesivo-sm">
        Kolô
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-display text-selo text-[var(--kolo-texto)]">Ateliê</span>
        <span className="font-display text-etiqueta text-[var(--kolo-texto-suave)]">
          Arte Urbana SP
        </span>
      </span>
    </span>
  );
}
