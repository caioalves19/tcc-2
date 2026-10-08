import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { DetalheObra } from "@/components/loja/detalhe-obra";
import { lerObraPublica, outrasObrasDoArtista } from "@/modules/catalog";
import { adicionarAoCarrinhoAcao } from "@/app/carrinho/actions";

type Props = { params: Promise<{ slug: string }> };

// A página e os metadados leem a mesma obra; o cache evita a segunda consulta.
const obraDoSlug = cache(lerObraPublica);

function resumir(texto: string, limite = 160): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  return limpo.length <= limite ? limpo : `${limpo.slice(0, limite - 1).trimEnd()}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const obra = await obraDoSlug((await params).slug);
  if (!obra) return { title: "Obra não encontrada · Kolô" };
  return {
    title: `${obra.titulo} · Kolô`,
    description: resumir(
      obra.descricao ?? `${obra.titulo}, obra de ${obra.artista.nome} no Kolô Ateliê.`,
    ),
  };
}

// RF10/RN01: pública, sem login. Rascunho, arquivada ou inexistente responde 404.
export default async function PaginaObra({ params }: Props) {
  const obra = await obraDoSlug((await params).slug);
  if (!obra) notFound();
  const outras = await outrasObrasDoArtista(obra);
  return (
    <section className="mx-auto w-full max-w-pagina px-margem py-12 md:px-margem-desktop md:py-16">
      <DetalheObra
        obra={obra}
        outras={outras}
        baseImagens={process.env.R2_PUBLIC_URL?.trim() || null}
        adicionar={adicionarAoCarrinhoAcao}
      />
    </section>
  );
}
