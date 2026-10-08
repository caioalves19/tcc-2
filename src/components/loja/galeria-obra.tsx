"use client";

import { useState } from "react";
import Image from "next/image";
import type { ImagemPublica } from "@/modules/catalog";

type Props = {
  titulo: string;
  // Na ordem cadastrada; a galeria abre na principal (RF10).
  imagens: ImagemPublica[];
  // URL pública do R2 (R2_PUBLIC_URL); sem ela, a foto vira um espaço reservado.
  baseImagens: string | null;
};

const MOLDURA =
  "relative overflow-hidden rounded-card border-2 border-neutro-grafite bg-[var(--kolo-superficie)] shadow-adesivo-sm";

// RF10/RNF14: next/image entrega formato moderno e tamanhos responsivos a partir do original.
export function GaleriaObra({ titulo, imagens, baseImagens }: Props) {
  const inicial = Math.max(
    0,
    imagens.findIndex((imagem) => imagem.principal),
  );
  const [atual, setAtual] = useState(inicial);
  const base = baseImagens?.replace(/\/+$/, "") ?? null;
  const exibida = imagens[atual];

  if (!base || !exibida)
    return (
      <div className={`${MOLDURA} grid aspect-[4/3] place-items-center text-nota`}>Sem foto</div>
    );

  return (
    <div role="group" aria-label={`Fotos de ${titulo}`} className="grid gap-4">
      <div className={`${MOLDURA} aspect-[4/3]`}>
        <Image
          src={`${base}/${exibida.chave}`}
          alt={exibida.textoAlternativo}
          fill
          priority
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-contain"
        />
      </div>
      {imagens.length > 1 && (
        <ul aria-label="Fotos da obra" className="grid grid-cols-4 gap-3">
          {imagens.map((imagem, i) => (
            <li key={imagem.chave}>
              <button
                type="button"
                aria-label={`Ver foto ${i + 1} de ${imagens.length}: ${imagem.textoAlternativo}`}
                aria-pressed={i === atual}
                onClick={() => setAtual(i)}
                className={`relative block aspect-square w-full overflow-hidden rounded-campo border-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                  i === atual ? "border-primary" : "border-neutro-grafite"
                }`}
              >
                {/* Decorativa: o nome do botão já descreve a foto. */}
                <Image
                  src={`${base}/${imagem.chave}`}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 12vw, 25vw"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
