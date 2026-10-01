import { Pool } from "pg";

import { databaseUrl } from "../database-url";

// Limite de tentativas por janela fixa, guardado no Postgres (RNF08).
// A janela começa na primeira tentativa; passado janelaMs, a contagem reinicia.
export type RegraLimite = { maximo: number; janelaMs: number };

export type SituacaoLimite = { bloqueado: false } | { bloqueado: true; liberaEm: Date };

let pool: Pool | undefined;

function obterPool(): Pool {
  pool ??= new Pool({ connectionString: databaseUrl() });
  return pool;
}

// Reserva a tentativa ANTES de fazer o trabalho caro (ex.: verificar senha).
// Somar e decidir no mesmo statement impede que uma rajada simultânea passe
// toda pela checagem antes de alguém gravar a contagem. O contador para em
// maximo + 1: já basta para bloquear e não cresce sem fim durante um ataque.
export async function consumirTentativa(
  chave: string,
  regra: RegraLimite,
  agora: Date = new Date(),
): Promise<SituacaoLimite> {
  const inicioValido = new Date(agora.getTime() - regra.janelaMs);
  const resultado = await obterPool().query<{ tentativas: number; janela_inicio: Date }>(
    `INSERT INTO rate_limit (chave, tentativas, janela_inicio)
     VALUES ($1, 1, $2)
     ON CONFLICT (chave) DO UPDATE SET
       tentativas = CASE WHEN rate_limit.janela_inicio <= $3 THEN 1 ELSE LEAST(rate_limit.tentativas + 1, $4) END,
       janela_inicio = CASE WHEN rate_limit.janela_inicio <= $3 THEN $2 ELSE rate_limit.janela_inicio END
     RETURNING tentativas, janela_inicio`,
    [chave, agora, inicioValido, regra.maximo + 1],
  );
  const linha = resultado.rows[0];
  if (linha === undefined || linha.tentativas <= regra.maximo) {
    return { bloqueado: false };
  }
  return { bloqueado: true, liberaEm: new Date(linha.janela_inicio.getTime() + regra.janelaMs) };
}

export async function limparTentativas(chave: string): Promise<void> {
  await obterPool().query("DELETE FROM rate_limit WHERE chave = $1", [chave]);
}
