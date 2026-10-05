import { headers } from "next/headers";
import { listarArtistas, listarContasDisponiveis, listarTaxonomias } from "@/modules/artists";
import { GestaoArtistas } from "@/components/admin/gestao-artistas";
import { criarArtistaAcao, editarArtistaAcao, excluirArtistaAcao } from "../actions";

export default async function PaginaArtistas() {
  const cabecalhos = await headers();
  const [artistas, contas, estilos] = await Promise.all([
    listarArtistas(cabecalhos),
    listarContasDisponiveis(cabecalhos),
    listarTaxonomias("estilos", cabecalhos),
  ]);
  return (
    <>
      <h1 className="mb-6 font-display text-2xl">Artistas</h1>
      {!artistas.ok ? (
        <p role="alert">{artistas.mensagem}</p>
      ) : !contas.ok ? (
        <p role="alert">{contas.mensagem}</p>
      ) : !estilos.ok ? (
        <p role="alert">{estilos.mensagem}</p>
      ) : (
        <GestaoArtistas
          registros={artistas.dados}
          contas={contas.dados}
          estilos={estilos.dados}
          criar={criarArtistaAcao}
          editar={editarArtistaAcao}
          excluir={excluirArtistaAcao}
        />
      )}
    </>
  );
}
