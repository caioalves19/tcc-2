export { criarTaxonomia, listarTaxonomias, editarTaxonomia, excluirTaxonomia } from "./taxonomias";
export type {
  ResultadoGestao,
  EntradaArtista,
  EntradaEditarArtista,
  EntradaTaxonomia,
  TipoTaxonomia,
} from "./validacao";
export {
  criarArtista,
  listarArtistas,
  listarContasDisponiveis,
  editarArtista,
  excluirArtista,
} from "./artistas";
export { verificarAcessoAdmin } from "./acesso";
// Usados também pelo catálogo (PBI-18): mesma checagem de ADMIN dentro da transação.
export { comoAdmin, validar, ErroGestao } from "./acesso";
export { listarArtistasParaWizard } from "./publico";
