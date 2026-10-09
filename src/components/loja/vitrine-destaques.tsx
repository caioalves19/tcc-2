import { buttonVariants } from "@/components/ui/button";
import { CardObra } from "@/components/loja/card-obra";
import type { CardObra as DadosCard } from "@/modules/catalog";

type Props = {
  // listarDestaques (PBI-21): até 4 obras marcadas pelo ADMIN, já na ordem de exibição.
  destaques: DadosCard[];
  // URL pública do R2 (R2_PUBLIC_URL); sem ela, as fotos viram espaço reservado.
  baseImagens: string | null;
};

// RF07: obras em destaque da home, com o caminho para o catálogo completo. Sem nenhuma obra
// marcada, a seção some: a home segue com o "Ver obras" do topo.
export function VitrineDestaques({ destaques, baseImagens }: Props) {
  if (destaques.length === 0) return null;
  return (
    <section
      aria-labelledby="titulo-destaques"
      className="mx-auto max-w-pagina px-margem py-16 md:px-margem-desktop md:py-24"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-etiqueta uppercase text-[var(--kolo-link)]">
            Acervo do ateliê
          </p>
          <h2
            id="titulo-destaques"
            className="mt-2 font-display text-titulo-xl-mobile uppercase md:text-titulo-xl"
          >
            Obras <span className="text-[var(--kolo-link)]">em destaque</span>
          </h2>
          <p className="mt-2 text-[var(--kolo-texto-suave)]">
            Escolhidas pelo ateliê entre as obras do catálogo.
          </p>
        </div>
        <a href="/obras" className={buttonVariants({ variant: "contorno" })}>
          Ver catálogo completo
        </a>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {destaques.map((obra) => (
          <CardObra key={obra.slug} obra={obra} baseImagens={baseImagens} />
        ))}
      </div>
    </section>
  );
}
