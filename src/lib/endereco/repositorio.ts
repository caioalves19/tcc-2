import { randomUUID } from "node:crypto";

import type { DadosEndereco, EntradaEndereco } from "../../modules/endereco";
import { obterPool } from "../db";

type LinhaEndereco = {
  destinatario: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
};

// Todas as consultas filtram por user_id (único na tabela): não existe leitura nem escrita
// de endereço sem o dono. O id do usuário nunca vem do navegador (ver ./index.ts).
export async function obterEnderecoDoUsuario(userId: string): Promise<EntradaEndereco | null> {
  const { rows } = await obterPool().query<LinhaEndereco>(
    `SELECT destinatario, cep, logradouro, numero, complemento, bairro, cidade, uf
       FROM address
      WHERE user_id = $1`,
    [userId],
  );
  const linha = rows[0];
  if (linha === undefined) {
    return null;
  }
  return { ...linha, complemento: linha.complemento ?? "" };
}

// Um endereço por usuário: o UNIQUE de user_id faz o segundo envio atualizar o mesmo registro.
// O id é gerado aqui porque o Prisma gera o uuid no cliente, não há DEFAULT no banco.
export async function salvarEnderecoDoUsuario(
  userId: string,
  dados: DadosEndereco,
): Promise<void> {
  await obterPool().query(
    `INSERT INTO address
       (id, user_id, destinatario, logradouro, numero, complemento, bairro, cidade, uf, cep)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (user_id) DO UPDATE SET
       destinatario = EXCLUDED.destinatario,
       logradouro   = EXCLUDED.logradouro,
       numero       = EXCLUDED.numero,
       complemento  = EXCLUDED.complemento,
       bairro       = EXCLUDED.bairro,
       cidade       = EXCLUDED.cidade,
       uf           = EXCLUDED.uf,
       cep          = EXCLUDED.cep`,
    [
      randomUUID(),
      userId,
      dados.destinatario,
      dados.logradouro,
      dados.numero,
      dados.complemento,
      dados.bairro,
      dados.cidade,
      dados.uf,
      dados.cep,
    ],
  );
}