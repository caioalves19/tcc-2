import { headers } from "next/headers";
import { listarArtistas, listarTaxonomias } from "@/modules/artists";
import { listarObras } from "@/modules/catalog";
import { GestaoObras } from "@/components/admin/gestao-obras";
import { solicitarUploadAcao } from "../../imagens/actions";
import {
  adicionarImagemAcao,
  criarObraAcao,
  definirImagemPrincipalAcao,
  editarObraAcao,
  editarTextoAlternativoAcao,
  excluirObraAcao,
  moverImagemAcao,
  removerImagemAcao,
} from "./actions";

const primeiro = (valor: string | string[] | undefined) =>
  Array.isArray(valor) ? valor[0] : valor;

export default async function PaginaObras({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { pagina, editar } = await searchParams;
  const cabecalhos = await headers();
  const [obras, artistas, tags] = await Promise.all([
    listarObras(cabecalhos, { pagina: primeiro(pagina), editar: primeiro(editar) }),
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
          registros={obras.dados.obras}
          emEdicao={obras.dados.emEdicao}
          total={obras.dados.total}
          pagina={obras.dados.pagina}
          totalPaginas={obras.dados.totalPaginas}
          artistas={artistas.dados.map((artista) => ({ id: artista.id, nome: artista.nome }))}
          tags={tags.dados.map((tag) => ({ id: tag.id, nome: tag.nome }))}
          criar={criarObraAcao}
          editar={editarObraAcao}
          excluir={excluirObraAcao}
          acoesImagem={{
            baseImagens: process.env.R2_PUBLIC_URL?.trim() || null,
            solicitar: solicitarUploadAcao,
            adicionar: adicionarImagemAcao,
            definirPrincipal: definirImagemPrincipalAcao,
            mover: moverImagemAcao,
            editarTexto: editarTextoAlternativoAcao,
            remover: removerImagemAcao,
          }}
        />
      )}
    </>
  );
}
