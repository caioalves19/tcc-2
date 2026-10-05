import Image from "next/image";

import { cn } from "cn";

// Mascotes do Kolô (PBI-09). Uso por fundo: seção 7 de docs/IDENTIDADE-VISUAL.md.
const MASCOTES = {
  // Lata de tinta: fundo claro ou grafite. No marinho o contorno azul some.
  atelie: { src: "/marca/atelie-mascote.svg", largura: 185, altura: 200 },
  // Tatu: serve nos três fundos; o natural dele é o marinho.
  tattoo: { src: "/marca/tattoo-mascote.svg", largura: 240, altura: 121 },
} as const;

type MascoteProps = {
  readonly marca: keyof typeof MASCOTES;
  readonly className?: string;
};

// Decorativo: o alt vazio tira a imagem da leitura de tela, porque a marca já é
// anunciada pelo texto ao lado. Não use o mascote sozinho no lugar de um texto.
export function Mascote({ marca, className }: MascoteProps) {
  const mascote = MASCOTES[marca];
  return (
    <Image
      src={mascote.src}
      alt=""
      width={mascote.largura}
      height={mascote.altura}
      unoptimized
      className={cn("h-auto", className)}
    />
  );
}
