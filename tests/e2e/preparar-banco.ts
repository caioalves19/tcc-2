// Recria o banco kolo_e2e (migrações + dados fixos de tests/e2e/dados.ts) antes do servidor do
// E2E subir. Roda dentro do comando do webServer, então termina antes do `next start`.
import { mkdirSync, rmSync } from "node:fs";
import { basename } from "node:path";

import { hashPassword } from "better-auth/crypto";
import type { Client } from "pg";

import { prepararBancoDeTeste } from "../integration/banco-de-teste";
import {
  ADMIN,
  ARTISTA,
  BANCO_E2E,
  ESTILOS,
  OBRA,
  OUTRO_ARTISTA,
  TAMANHOS,
  WHATSAPP_E2E,
} from "./dados";

// RF06: conta com credencial do Better Auth (mesmo formato do prisma/seed.ts).
async function conta(
  db: Client,
  usuario: { userId: string; nome: string; email: string },
  papel: "ADMIN" | "ARTISTA",
  senhaHash: string,
): Promise<void> {
  await db.query(
    `INSERT INTO "user" (id, papel, nome, email, situacao, atualizado_em)
     VALUES ($1, $2, $3, $4, 'ATIVO', now())`,
    [usuario.userId, papel, usuario.nome, usuario.email],
  );
  await db.query(
    `INSERT INTO account (id, user_id, provedor, id_externo, senha_hash, atualizado_em)
     VALUES (gen_random_uuid(), $1, 'credential', $2, $3, now())`,
    [usuario.userId, usuario.userId, senhaHash],
  );
}

async function preparar(): Promise<void> {
  const senha = process.env.E2E_SENHA_EQUIPE;
  if (!senha) throw new Error("E2E_SENHA_EQUIPE ausente: rode pelo npm run test:e2e.");
  const senhaHash = await hashPassword(senha);
  // RF27: o "bucket" do E2E começa vazio a cada rodada.
  const pastaR2 = process.env.E2E_R2_DIR;
  if (!pastaR2) throw new Error("E2E_R2_DIR ausente: rode pelo npm run test:e2e.");
  // A pasta é apagada inteira: só aceita a do E2E, nunca outra que venha do ambiente.
  if (basename(pastaR2) !== "kolo-e2e-r2")
    throw new Error(`E2E_R2_DIR precisa terminar em kolo-e2e-r2: ${pastaR2}`);
  rmSync(pastaR2, { recursive: true, force: true });
  mkdirSync(pastaR2, { recursive: true });
  const db = await prepararBancoDeTeste(BANCO_E2E);
  try {
    await conta(db, ADMIN, "ADMIN", senhaHash);
    for (const artista of [ARTISTA, OUTRO_ARTISTA]) {
      await conta(db, artista, "ARTISTA", senhaHash);
      await db.query(`INSERT INTO artist (id, user_id, slug) VALUES ($1, $2, $3)`, [
        artista.id,
        artista.userId,
        artista.slug,
      ]);
    }
    // RN10: um trabalho do outro artista, que a Bia não pode ver na gestão dela.
    await db.query(
      `INSERT INTO portfolio_item (id, artist_id, titulo, imagem_url, ordem) VALUES ($1, $2, $3, $4, 1)`,
      [
        OUTRO_ARTISTA.trabalho.id,
        OUTRO_ARTISTA.id,
        OUTRO_ARTISTA.trabalho.titulo,
        `portfolio/${OUTRO_ARTISTA.id}/fixture.jpg`,
      ],
    );
    for (const estilo of ESTILOS) {
      await db.query(`INSERT INTO tattoo_style (id, nome, slug) VALUES ($1, $2, $3)`, [
        estilo.id,
        estilo.nome,
        estilo.slug,
      ]);
      await db.query(`INSERT INTO artist_style (artist_id, tattoo_style_id) VALUES ($1, $2)`, [
        ARTISTA.id,
        estilo.id,
      ]);
    }
    for (const tamanho of TAMANHOS) {
      await db.query(`INSERT INTO size_tier (id, nome, ordem) VALUES ($1, $2, $3)`, [
        tamanho.id,
        tamanho.nome,
        tamanho.ordem,
      ]);
    }
    // RF26/RN02: a obra que o E2E da compra leva, Disponível e com uma unidade.
    await db.query(
      `INSERT INTO artwork (id, artist_id, titulo, slug, preco_centavos, quantidade_estoque, situacao)
       VALUES ($1, $2, $3, $4, $5, 1, 'DISPONIVEL')`,
      [OBRA.id, ARTISTA.id, OBRA.titulo, OBRA.slug, OBRA.precoCentavos],
    );
    // RF31: o WhatsApp que o wizard usa vem das configurações do site.
    await db.query(
      `INSERT INTO site_setting (id, chave, valor) VALUES (gen_random_uuid(), $1, $2)`,
      [
        "contato",
        JSON.stringify({
          email: "contato@kolo.test",
          whatsapp: WHATSAPP_E2E,
          instagramAtelie: "koloatelie",
          instagramTattoo: "kolotattoo",
        }),
      ],
    );
  } finally {
    await db.end();
  }
}

await preparar();
