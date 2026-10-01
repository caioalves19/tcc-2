import { after } from "next/server";

import { obterPool } from "../db";
import { escolherEnviador, type EnviadorEmail } from "./enviador";
import { renderizarRecuperacaoDeSenha } from "./recuperacao-senha";

let enviadorInjetado: EnviadorEmail | undefined;

// Troca o provedor (os testes usam um falso). undefined volta ao padrão do ambiente.
export function usarEnviador(enviador: EnviadorEmail | undefined): void {
  enviadorInjetado = enviador;
}

function obterEnviador(): EnviadorEmail {
  return enviadorInjetado ?? escolherEnviador(process.env);
}

// Numa requisição do Next, a tarefa roda depois da resposta (after): o tempo de envio
// não revela se o e-mail tem conta. Fora de requisição (testes, scripts), roda na hora.
export function despacharForaDaResposta(tarefa: () => Promise<void>): Promise<void> {
  try {
    after(tarefa);
  } catch (erro) {
    if (erro instanceof Error && erro.message.includes("outside a request scope")) {
      return tarefa();
    }
    throw erro;
  }
  return Promise.resolve();
}

// Registra em email_log (PENDENTE → ENVIADO/FALHO) sem nunca gravar o link.
// Falha do provedor não sobe: vira FALHO e log no servidor.
export async function enviarEmailDeRecuperacao(dados: {
  userId: string;
  nome: string;
  para: string;
  link: string;
}): Promise<void> {
  const pool = obterPool();
  const registro = await pool.query<{ id: string }>(
    `INSERT INTO email_log (id, user_id, destinatario, template, situacao)
     VALUES (gen_random_uuid(), $1, $2, 'recuperacao-senha', 'PENDENTE')
     RETURNING id`,
    [dados.userId, dados.para],
  );
  const id = registro.rows[0]?.id;
  let provedor = "desconhecido";
  try {
    const enviador = obterEnviador();
    provedor = enviador.provedor;
    const email = await renderizarRecuperacaoDeSenha({ nome: dados.nome, link: dados.link });
    const { idExterno } = await enviador.enviar({ para: dados.para, ...email });
    await pool.query(
      "UPDATE email_log SET situacao = 'ENVIADO', enviado_em = now(), metadados = $2 WHERE id = $1",
      [id, idExterno === undefined ? { provedor } : { provedor, idExterno }],
    );
  } catch (erro) {
    const motivo = (erro instanceof Error ? erro.message : "erro desconhecido").slice(0, 200);
    await pool.query("UPDATE email_log SET situacao = 'FALHO', metadados = $2 WHERE id = $1", [
      id,
      { provedor, erro: motivo },
    ]);
    console.error("Falha ao enviar o e-mail de recuperação de senha", { emailLog: id, motivo });
  }
}
