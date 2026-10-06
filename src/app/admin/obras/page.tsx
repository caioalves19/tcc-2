import { headers } from "next/headers";
import { listarArtistas, listarTaxonomias } from "@/modules/artists";
import { listarObras } from "@/modules/catalog";
import { GestaoObras } from "@/components/admin/gestao-obras";
import { criarObraAcao, editarObraAcao, excluirObraAcao } from "./actions";

export default async function PaginaObras() {
  const cabecalhos = await headers();
  const [obras, artistas, tags] = await Promise.all([
    listarObras(cabecalhos),
    listarArtistas(cabecalhos),
    listarTaxonomias("tags", cabecalhos),
  ]);
  return (
    <>
      <h1 className="mb-6 font-display text-2xl">Obras</h1>
      {!obras.ok ? (
        <p role="alert">{obras.mensagem}</p>
      ) : !artistas.ok ? (
        <p role="alert">{artistas.mensagem}</p>
      ) : !tags.ok ? (
        <p role="alert">{tags.mensagem}</p>
      ) : (
        <GestaoObras
          registros={obras.dados}
          artistas={artistas.dados.map((artista) => ({ id: artista.id, nome: artista.nome }))}
          tags={tags.dados.map((tag) => ({ id: tag.id, nome: tag.nome }))}
          criar={criarObraAcao}
          editar={editarObraAcao}
          excluir={excluirObraAcao}
        />
      )}
    </>
  );
}
