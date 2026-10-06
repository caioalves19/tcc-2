import type { Metadata } from "next";
import { headers } from "next/headers";
import { WizardAgendamento } from "@/components/scheduling/wizard-agendamento";
import { carregarOpcoesWizard } from "@/modules/scheduling";
import { revisarPreferenciaAcao } from "./actions";

export const metadata: Metadata = { title: "Agendamento · Kolô" };

export default async function PaginaAgendamento() {
  const resultado = await carregarOpcoesWizard(await headers());
  return (
    <section data-brand="tattoo" className="bg-[var(--kolo-fundo)] text-[var(--kolo-texto)]">
      <div className="mx-auto max-w-4xl px-margem py-12 md:px-margem-desktop md:py-16">
        <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
          Agendar tatuagem
        </h1>
        <p className="mb-8 mt-4">
          Conte suas preferências para a tatuagem. Você não precisa de uma conta para preencher.
        </p>
        {resultado.ok ? (
          <WizardAgendamento opcoes={resultado.dados} revisar={revisarPreferenciaAcao} />
        ) : (
          <div role="alert">
            <p>{resultado.mensagem}</p>
            <a href="/agendamento" className="mt-4 inline-block underline">
              Tentar novamente
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
