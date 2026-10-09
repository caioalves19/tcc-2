import type { Metadata } from "next";
import { CatalogoObras } from "@/components/loja/catalogo-obras";
import { listarCatalogo } from "@/modules/catalog";

export const metadata: Metadata = {
  title: "Catálogo de obras · Kolô",
  description: "Obras originais dos artistas do Kolô Ateliê, em São Paulo.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Parâmetro repetido na URL (?pagina=1&pagina=2): vale o primeiro.
function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

// RF09/RN01: catálogo público. Página, ordenação e busca (PBI-41) vêm da URL; o módulo valida e
// cai no padrão.
export default async function PaginaCatalogo({ searchParams }: Props) {
  const { pagina, ordem, busca } = await searchParams;
  const catalogo = await listarCatalogo({
    pagina: primeiro(pagina),
    ordem: primeiro(ordem),
    busca: primeiro(busca),
  });
  return (
    <section className="mx-auto w-full max-w-pagina px-margem py-12 md:px-margem-desktop md:py-16">
      <CatalogoObras {...catalogo} baseImagens={process.env.R2_PUBLIC_URL?.trim() || null} />
    </section>
  );
}
