import { headers } from "next/headers";
import { listarTaxonomiasPaginadas } from "@/modules/artists";
import { GestaoTaxonomias } from "@/components/admin/gestao-taxonomias";
import { salvarEstiloAcao, excluirEstiloAcao } from "../actions";

export default async function PaginaEstilos({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { pagina } = await searchParams;
  const resultado = await listarTaxonomiasPaginadas(
    "estilos",
    { pagina: Array.isArray(pagina) ? pagina[0] : pagina },
    await headers(),
  );
  return (
    <>
      <h1 className="mb-6 font-display text-2xl">Estilos de tatuagem</h1>
      {!resultado.ok ? (
        <p role="alert">{resultado.mensagem}</p>
      ) : (
        <GestaoTaxonomias
          tipo="estilos"
          {...resultado.dados}
          salvar={salvarEstiloAcao}
          excluir={excluirEstiloAcao}
        />
      )}
    </>
  );
}
