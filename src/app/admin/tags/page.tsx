import { headers } from "next/headers";
import { listarTaxonomias } from "@/modules/artists";
import { GestaoTaxonomias } from "@/components/admin/gestao-taxonomias";
import { salvarTagAcao, excluirTagAcao } from "../actions";

export default async function PaginaTags() {
  const registros = await listarTaxonomias("tags", await headers());
  return (
    <>
      <h1 className="mb-6 font-display text-2xl">Tags das obras</h1>
      {!registros.ok ? (
        <p role="alert">{registros.mensagem}</p>
      ) : (
        <GestaoTaxonomias
          tipo="tags"
          registros={registros.dados}
          salvar={salvarTagAcao}
          excluir={excluirTagAcao}
        />
      )}
    </>
  );
}
