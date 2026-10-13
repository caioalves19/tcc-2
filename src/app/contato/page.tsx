import type { Metadata } from "next";

import { lerConfiguracao } from "@/modules/settings";

import { FormularioContato } from "./formulario";

export const metadata: Metadata = {
  title: "Contato · Kolô",
};

export default async function PaginaContato() {
  // RF31: horários das configurações do site (PBI-39); sem horário salvo, a seção não aparece.
  const { horarios } = await lerConfiguracao();
  return (
    <section className="mx-auto w-full max-w-2xl px-margem py-16 md:py-24">
      <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">Contato</h1>
      <p className="mt-3 text-corpo text-[var(--kolo-texto-suave)]">
        Envie sua dúvida ou solicitação. Responderemos o mais breve possível.
      </p>
      {horarios.length > 0 && (
        <section aria-labelledby="contato-horarios" className="mt-8">
          <h2 id="contato-horarios" className="font-display text-titulo-sm uppercase">
            Horários de atendimento
          </h2>
          <ul className="mt-2 grid gap-1">
            {horarios.map((linha) => (
              <li key={linha}>{linha}</li>
            ))}
          </ul>
        </section>
      )}
      <div className="mt-8">
        <FormularioContato />
      </div>
    </section>
  );
}
