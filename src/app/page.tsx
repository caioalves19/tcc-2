import { Marca } from "@/components/layout/marca";
import { Button } from "@/components/ui/button";

// Placeholder do PBI-10: existe para mostrar o layout base e os dois modos de
// marca funcionando. A home de verdade entra na Fase 1 (ORDEM-DE-EXECUCAO.md).
export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-pagina px-margem py-16 md:px-margem-desktop md:py-24">
        <p className="font-display text-etiqueta uppercase text-[var(--kolo-link)]">
          Modo Ateliê · placeholder
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-display-mobile uppercase md:text-display">
          Arte urbana autêntica, feita por{" "}
          <span className="inline-block rounded-campo border-2 border-neutro-grafite bg-atelie-amarelo px-3 text-neutro-grafite shadow-adesivo">
            pessoas reais
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-corpo-lg text-[var(--kolo-texto-suave)]">
          Esta página é um placeholder do layout base. Ela existe para conferir cabeçalho, rodapé,
          tipografia e os dois modos de marca antes das telas reais.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Button>Ver obras</Button>
          <Button variant="contorno">Falar no WhatsApp</Button>
        </div>
      </section>

      <section
        data-brand="tattoo"
        className="bg-[var(--kolo-fundo)] text-[var(--kolo-texto)] shadow-brilho"
      >
        <div className="mx-auto flex max-w-pagina flex-col gap-6 px-margem py-16 md:px-margem-desktop md:py-24">
          <Marca marca="tattoo" />
          <h2 className="max-w-2xl font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
            O mesmo sistema, <span className="text-[var(--kolo-link)]">outra marca</span>
          </h2>
          <p className="max-w-2xl text-corpo-lg text-[var(--kolo-texto-suave)]">
            Este bloco só tem um atributo a mais. Os botões, as cores e os cantos mudaram sozinhos,
            porque leem os mesmos papéis de token.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button>Agendar tatuagem</Button>
            <Button variant="contorno">Ver portfólio</Button>
          </div>
        </div>
      </section>
    </>
  );
}
