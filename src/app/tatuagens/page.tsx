import type { Metadata } from "next";
import { listarGaleria } from "@/modules/portfolio";
import { GaleriaTatuagens } from "@/components/portfolio/galeria-tatuagens";

export const metadata: Metadata = {
  title: "Galeria de tatuagens · Kolô",
  description:
    "Trabalhos realizados pelos artistas do Kolô. Filtre por artista, estilo e região do corpo.",
};
// A vitrine reflete as alterações da gestão sem armazenar resultados em cache.
export const dynamic = "force-dynamic";
const primeiro = (valor: string | string[] | undefined) =>
  Array.isArray(valor) ? valor[0] : valor;
export default async function PaginaGaleria({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { artista, estilo, regiao } = await searchParams;
  const galeria = await listarGaleria({
    artista: primeiro(artista),
    estilo: primeiro(estilo),
    regiao: primeiro(regiao),
  });
  return (
    <section className="mx-auto w-full max-w-pagina px-margem py-12 md:px-margem-desktop md:py-16">
      <GaleriaTatuagens {...galeria} baseImagens={process.env.R2_PUBLIC_URL?.trim() || null} />
    </section>
  );
}
