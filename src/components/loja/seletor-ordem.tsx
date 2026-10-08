"use client";

import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  hrefCatalogo,
  ORDENS_CATALOGO,
  ROTULOS_ORDEM,
  type OrdemCatalogo,
} from "@/modules/catalog/cliente";

// RF09: trocar a ordenação volta para a primeira página. Sem JavaScript, o formulário GET
// faz o mesmo pelo botão "Ordenar".
export function SeletorOrdem({ ordem }: { ordem: OrdemCatalogo }) {
  const router = useRouter();
  return (
    <form method="get" action="/obras" className="flex flex-wrap items-center gap-2">
      <label htmlFor="ordem-catalogo" className="text-nota">
        Ordenar por
      </label>
      <select
        id="ordem-catalogo"
        name="ordem"
        defaultValue={ordem}
        onChange={(evento) => router.push(hrefCatalogo(evento.target.value as OrdemCatalogo))}
        className="h-12 rounded-campo border-2 border-[var(--kolo-contorno)] bg-transparent px-3"
      >
        {ORDENS_CATALOGO.map((opcao) => (
          <option key={opcao} value={opcao}>
            {ROTULOS_ORDEM[opcao]}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className={buttonVariants({ variant: "contorno", size: "sm" })}>
          Ordenar
        </button>
      </noscript>
    </form>
  );
}
