import { ClipboardCheck, Handshake, MessageCircle } from "lucide-react";
import { cn } from "cn";
import { unstable_rethrow } from "next/navigation";

import { Marca } from "@/components/layout/marca";
import { Mascote } from "@/components/layout/mascote";
import { VitrineDestaques } from "@/components/loja/vitrine-destaques";
import { buttonVariants } from "@/components/ui/button";
import { linkWhatsApp } from "@/lib/contato";
import { listarDestaques } from "@/modules/catalog";

// Chamada provisória do RF07: o PBI-33 troca o WhatsApp do bloco de tatuagem pelo wizard.
const MENSAGEM_TATUAGEM = "Olá! Quero agendar uma tatuagem no Kolô.";
const MENSAGEM_MURAL = "Olá! Quero pedir um orçamento de mural.";

// O fluxo de hoje, sem o wizard: o site não marca horário (RN01) e anamnese e termo são
// presenciais (RF23 a RF25).
const PASSOS_TATUAGEM = [
  {
    icone: MessageCircle,
    titulo: "Chame no WhatsApp",
    texto: "Conte a sua ideia: o desenho, o tamanho e a região do corpo.",
  },
  {
    icone: Handshake,
    titulo: "Combine com o artista",
    texto: "Estilo, orçamento e horário são acertados na conversa, direto com quem vai tatuar.",
  },
  {
    icone: ClipboardCheck,
    titulo: "Sessão no estúdio",
    texto:
      "A anamnese e o termo de consentimento são preenchidos no estúdio, antes de tatuar. É preciso ter 18 anos.",
  },
] as const;

// Se o banco falhar, a home segue no ar sem a seção de destaques, como o layout faz com a sessão.
async function destaquesDaHome() {
  try {
    return await listarDestaques();
  } catch (erro) {
    unstable_rethrow(erro);
    console.error("Falha ao ler os destaques da home", erro);
    return [];
  }
}

// RF07: vitrine institucional do Kolô. Os destaques vêm do banco a cada visita (o layout já
// lê a sessão, então a página não é gerada no build).
export default async function Home() {
  const destaques = await destaquesDaHome();
  return (
    <>
      <section className="mx-auto grid max-w-pagina items-center gap-10 px-margem py-16 md:grid-cols-[1fr_auto] md:px-margem-desktop md:py-24">
        <div>
          <p className="font-display text-etiqueta uppercase text-[var(--kolo-link)]">
            Ateliê de arte urbana · São Paulo
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-display-mobile uppercase md:text-display">
            Arte urbana autêntica, feita por{" "}
            <span className="inline-block rounded-campo border-2 border-neutro-grafite bg-atelie-amarelo px-3 text-neutro-grafite shadow-adesivo">
              pessoas reais
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-corpo-lg text-[var(--kolo-texto-suave)]">
            O Kolô reúne um ateliê de arte urbana, com telas, murais e customizações, e um estúdio
            de tatuagem. As obras do catálogo vêm direto dos nossos artistas.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href="/obras" className={buttonVariants()}>
              Ver obras
            </a>
            <a href="#tatuagem" className={buttonVariants({ variant: "contorno" })}>
              Agendar tatuagem
            </a>
          </div>
        </div>
        <Mascote marca="atelie" className="hidden w-64 md:block" />
      </section>

      <div className="border-t-2 border-neutro-grafite">
        <VitrineDestaques
          destaques={destaques}
          baseImagens={process.env.R2_PUBLIC_URL?.trim() || null}
        />
      </div>

      <section
        id="tatuagem"
        data-brand="tattoo"
        aria-labelledby="titulo-tatuagem"
        className="scroll-mt-20 bg-[var(--kolo-fundo)] text-[var(--kolo-texto)] shadow-brilho"
      >
        <div className="mx-auto flex max-w-pagina flex-col items-center gap-6 px-margem py-16 text-center md:px-margem-desktop md:py-24">
          <div className="flex items-center gap-5">
            <Mascote marca="tattoo" className="w-28 md:w-36" />
            <Marca variante="tattoo" />
          </div>
          <h2
            id="titulo-tatuagem"
            className="max-w-2xl font-display text-titulo-xl-mobile uppercase md:text-titulo-xl"
          >
            Sua tatuagem começa <span className="text-[var(--kolo-link)]">numa conversa</span>
          </h2>
          <p className="max-w-2xl text-corpo-lg text-[var(--kolo-texto-suave)]">
            Um espaço para trocar ideia, criar e tatuar com tranquilidade.
          </p>
          <ol className="mt-4 grid w-full gap-4 text-left md:grid-cols-3">
            {PASSOS_TATUAGEM.map(({ icone: Icone, titulo, texto }, indice) => (
              <li
                key={titulo}
                className="grid content-start gap-2 rounded-card bg-[var(--kolo-marca)] p-6 text-[var(--kolo-marca-texto)]"
              >
                <Icone aria-hidden className="size-6 text-[var(--kolo-link)]" />
                <h3 className="font-display text-titulo-lg">
                  {indice + 1}. {titulo}
                </h3>
                <p className="text-[var(--kolo-texto-suave)]">{texto}</p>
              </li>
            ))}
          </ol>
          <a
            href={linkWhatsApp(MENSAGEM_TATUAGEM)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ className: "mt-4" })}
          >
            Agendar pelo WhatsApp
          </a>
        </div>
      </section>

      <section
        aria-labelledby="titulo-murais"
        className="mx-auto max-w-pagina px-margem py-16 md:px-margem-desktop md:py-24"
      >
        <div className="grid items-center gap-6 rounded-card border-2 border-neutro-grafite bg-[var(--kolo-marca)] p-8 text-[var(--kolo-marca-texto)] shadow-adesivo md:grid-cols-[1fr_auto] md:p-12">
          <div>
            <p className="font-display text-etiqueta uppercase">Murais e intervenções</p>
            <h2
              id="titulo-murais"
              className="mt-2 max-w-2xl font-display text-titulo-xl-mobile uppercase md:text-titulo-xl"
            >
              Seu espaço merece mais que uma parede branca
            </h2>
            <p className="mt-4 max-w-2xl text-corpo-lg">
              Murais sob encomenda para casas, empresas, restaurantes e fachadas, criados pelos
              artistas do Kolô.
            </p>
          </div>
          <a
            href={linkWhatsApp(MENSAGEM_MURAL)}
            target="_blank"
            rel="noopener noreferrer"
            // O rótulo é longo: no celular quebra a linha em vez de passar da borda do cartão.
            className={cn(buttonVariants(), "h-auto min-h-12 whitespace-normal py-3 text-center")}
          >
            Pedir orçamento pelo WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
