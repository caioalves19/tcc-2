import { headers } from "next/headers";
import { listarTaxonomias } from "@/modules/artists";
import { GestaoTaxonomias } from "@/components/admin/gestao-taxonomias";
import { salvarEstiloAcao, excluirEstiloAcao } from "../actions";

export default async function PaginaEstilos() {
  const registros = await listarTaxonomias("estilos", await headers());
  return (
    <>
      <h1 className="mb-6 font-display text-2xl">Estilos de tatuagem</h1>
      {!registros.ok ? (
        <p role="alert">{registros.mensagem}</p>
      ) : (
        <GestaoTaxonomias
          tipo="estilos"
          registros={registros.dados}
          salvar={salvarEstiloAcao}
          excluir={excluirEstiloAcao}
        />
      )}
    </>
  );
}
