// Recria o banco kolo_e2e (migrações + dados fixos de tests/e2e/dados.ts) antes do servidor do
// E2E subir. Roda dentro do comando do webServer, então termina antes do `next start`.
import { prepararBancoDeTeste } from "../integration/banco-de-teste";
import { ARTISTA, BANCO_E2E, ESTILOS, TAMANHOS, WHATSAPP_E2E } from "./dados";

async function preparar(): Promise<void> {
  const db = await prepararBancoDeTeste(BANCO_E2E);
  try {
    await db.query(
      `INSERT INTO "user" (id, papel, nome, email, situacao, atualizado_em)
       VALUES ($1, 'ARTISTA', $2, $3, 'ATIVO', now())`,
      [ARTISTA.userId, ARTISTA.nome, ARTISTA.email],
    );
    await db.query(`INSERT INTO artist (id, user_id, slug) VALUES ($1, $2, $3)`, [
      ARTISTA.id,
      ARTISTA.userId,
      ARTISTA.slug,
    ]);
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
