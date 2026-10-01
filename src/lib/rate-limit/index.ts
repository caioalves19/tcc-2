import { Pool } from "pg";

import { databaseUrl } from "../database-url";

// Limite de tentativas por janela fixa, guardado no Postgres (RNF08).
// A janela começa na primeira falha; passado janelaMs, a próxima falha reinicia a contagem.
export type RegraLimite = { maximo: number; janelaMs: number };

export type SituacaoLimite = { bloqueado: false } | { bloqueado: true; liberaEm: Date };

let pool: Pool | undefined;

function obterPool(): Pool {
  pool ??= new Pool({ connectionString: databaseUrl() });
  return pool;
}

export async function registrarFalha(
  chave: string,
  regra: RegraLimite,
  agora: Date = new Date(),
): Promise<void> {
  const inicioValido = new Date(agora.getTime() - regra.janelaMs);
  // Um único statement: falhas concorrentes na mesma chave não se perdem.
  await obterPool().query(
    `INSERT INTO rate_limit (chave, falhas, janela_inicio)
     VALUES ($1, 1, $2)
     ON CONFLICT (chave) DO UPDATE SET
       falhas = CASE WHEN rate_limit.janela_inicio <= $3 THEN 1 ELSE rate_limit.falhas + 1 END,
       janela_inicio = CASE WHEN rate_limit.janela_inicio <= $3 THEN $2 ELSE rate_limit.janela_inicio END`,
    [chave, agora, inicioValido],
  );
}

export async function estaBloqueado(
  chave: string,
  regra: RegraLimite,
  agora: Date = new Date(),
): Promise<SituacaoLimite> {
  const resultado = await obterPool().query<{ falhas: number; janela_inicio: Date }>(
    "SELECT falhas, janela_inicio FROM rate_limit WHERE chave = $1",
    [chave],
  );
  const linha = resultado.rows[0];
  if (linha === undefined) {
    return { bloqueado: false };
  }
  const liberaEm = new Date(linha.janela_inicio.getTime() + regra.janelaMs);
  if (linha.falhas >= regra.maximo && liberaEm > agora) {
    return { bloqueado: true, liberaEm };
  }
  return { bloqueado: false };
}

export async function limparFalhas(chave: string): Promise<void> {
  await obterPool().query("DELETE FROM rate_limit WHERE chave = $1", [chave]);
}
