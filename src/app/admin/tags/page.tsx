import { headers } from "next/headers";
import { listarTaxonomiasPaginadas } from "@/modules/artists";
import { GestaoTaxonomias } from "@/components/admin/gestao-taxonomias";
import { salvarTagAcao, excluirTagAcao } from "../actions";

export default async function PaginaTags({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { pagina } = await searchParams;
  const resultado = await listarTaxonomiasPaginadas(
    "tags",
    { pagina: Array.isArray(pagina) ? pagina[0] : pagina },
    await headers(),
  );
  return (
    <>
      <h1 className="mb-6 font-display text-2xl">Tags das obras</h1>
      {!resultado.ok ? (
        <p role="alert">{resultado.mensagem}</p>
      ) : (
        <GestaoTaxonomias
          tipo="tags"
          {...resultado.dados}
          salvar={salvarTagAcao}
          excluir={excluirTagAcao}
        />
      )}
    </>
  );
}
