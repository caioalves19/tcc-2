"use client";

import { Button } from "@/components/ui/button";

// RF09: falha ao carregar (banco fora, por exemplo). Não mostra o erro técnico ao visitante.
// retry refaz a requisição ao servidor; reset só limparia o erro no navegador.
export default function ErroCatalogo({
  retry,
}: {
  error: unknown;
  reset: () => void;
  retry: () => void;
}) {
  return (
    <section className="mx-auto grid w-full max-w-md gap-4 px-margem py-16 md:py-24">
      <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
        Catálogo de obras
      </h1>
      <p role="alert">Não foi possível carregar o catálogo agora.</p>
      <Button type="button" onClick={() => retry()}>
        Tentar de novo
      </Button>
    </section>
  );
}
