import { buttonVariants } from "@/components/ui/button";

// RN01: rascunho, obra arquivada e slug inexistente caem aqui, sem revelar qual é o caso.
export default function ObraNaoEncontrada() {
  return (
    <section className="mx-auto grid w-full max-w-md gap-4 px-margem py-16 md:py-24">
      <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
        Obra não encontrada
      </h1>
      <p>Esta obra não existe ou não está mais na vitrine.</p>
      <a href="/" className={buttonVariants()}>
        Voltar ao início
      </a>
    </section>
  );
}
