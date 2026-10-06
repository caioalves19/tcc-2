import type { Metadata } from "next";

import { FormularioContato } from "./formulario";

export const metadata: Metadata = {
  title: "Contato · Kolô",
};

export default function PaginaContato() {
  return (
    <section className="mx-auto w-full max-w-2xl px-margem py-16 md:py-24">
      <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">Contato</h1>
      <p className="mt-3 text-corpo text-[var(--kolo-texto-suave)]">
        Envie sua dúvida ou solicitação. Responderemos o mais breve possível.
      </p>
      <div className="mt-8">
        <FormularioContato />
      </div>
    </section>
  );
}
