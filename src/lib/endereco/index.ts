import {
  validarEndereco,
  type EntradaEndereco,
  type ResultadoEndereco,
} from "../../modules/endereco";
import { usuarioIdDaRequisicao } from "../auth";
import { obterEnderecoDoUsuario, salvarEnderecoDoUsuario } from "./repositorio";

// O dono do endereço vem exclusivamente do cookie assinado da sessão, nunca de um id enviado
// pelo formulário: não há como ler nem alterar o endereço de outro usuário (RF05).
export async function enderecoDaRequisicao(cabecalhos: Headers): Promise<EntradaEndereco | null> {
  const userId = await usuarioIdDaRequisicao(cabecalhos);
  return userId === null ? null : obterEnderecoDoUsuario(userId);
}

export async function salvarEndereco(
  entrada: EntradaEndereco,
  cabecalhos: Headers,
): Promise<ResultadoEndereco> {
  const validacao = validarEndereco(entrada);
  if (!validacao.ok) return { ok: false, erro: "invalido", campos: validacao.campos };
  const userId = await usuarioIdDaRequisicao(cabecalhos);
  if (userId === null) return { ok: false, erro: "nao_autenticado" };
  await salvarEnderecoDoUsuario(userId, validacao.dados);
  return { ok: true };
}
