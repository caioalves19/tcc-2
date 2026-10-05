import Image from "next/image";

import { cn } from "cn";

// Marca do Kolô (PBI-09). Logos vetorizadas a partir dos arquivos do cliente.
// Uso por fundo: seção 7 de docs/IDENTIDADE-VISUAL.md. Nunca recolorir.
const LOGOS = {
  // Logo principal: leva o próprio amarelo, então serve em qualquer fundo.
  selo: { src: "/marca/atelie-selo.svg", largura: 80, altura: 48 },
  // Só em fundo escuro (grafite ou marinho): sobre o claro o amarelo some.
  lettering: { src: "/marca/atelie-lettering.svg", largura: 96, altura: 64 },
} as const;

type MarcaProps = {
  readonly variante?: keyof typeof LOGOS | "tattoo";
  readonly className?: string;
  // Só para a logo acima da dobra (cabeçalho): carrega antes do resto.
  readonly preload?: boolean;
};

export function Marca({ variante = "selo", className, preload = false }: MarcaProps) {
  if (variante === "tattoo") {
    // Wordmark em texto até chegar o arquivo do "KOLÔ TATTOO" (pendência na seção 7).
    return (
      <span className={cn("flex flex-col leading-none", className)}>
        <span className="font-display text-titulo-lg text-[var(--kolo-acao)]">KOLÔ</span>
        <span className="font-display text-etiqueta text-[var(--kolo-texto)]">TATTOO</span>
      </span>
    );
  }

  const logo = LOGOS[variante];
  return (
    <Image
      src={logo.src}
      alt="Kolô Ateliê"
      width={logo.largura}
      height={logo.altura}
      unoptimized
      preload={preload}
      className={cn("h-auto", className)}
    />
  );
}
