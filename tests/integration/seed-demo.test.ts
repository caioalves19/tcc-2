import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { Client } from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";

import { prepararBancoDeTeste } from "./banco-de-teste";

const NOME = "kolo_seed_demo";
const PASTA_LOCAL = "seed-teste-pbi49";
let db: Client;

function rodar(comando: string, env: Record<string, string> = {}): void {
  execSync(comando, {
    env: { ...process.env, SEED_ADMIN_PASSWORD: "", ...env },
    stdio: "pipe",
    shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
  });
}

beforeAll(async () => {
  db = await prepararBancoDeTeste(NOME);
  rodar("npx prisma db seed");
}, 120_000);

afterAll(async () => {
  await db.end();
});

// PBI-49: num banco novo o seed de demonstração cria os artistas, os estilos e as obras reais
// que o popular.ts procura, e repetir o comando não duplica nada. Um banco com a demonstração
// antiga (Marina Duarte, obras, tatuagens e estilos de IA) fica só com o que é do Kolô.
it("PBI-49 db:seed:demo cadastra os artistas do Kolô, estilos e obras e tira a demonstração de IA", async () => {
  const marina = await db.query<{ id: string }>(
    `INSERT INTO "user" (id, papel, nome, email, atualizado_em)
     VALUES (gen_random_uuid(), 'ARTISTA', 'Marina Duarte', 'marina.duarte@kolo.test', NOW())
     RETURNING id`,
  );
  const marinaArtista = await db.query<{ id: string }>(
    `INSERT INTO artist (id, user_id, slug) VALUES (gen_random_uuid(), $1, 'demo-marina-duarte')
     RETURNING id`,
    [marina.rows[0]?.id],
  );
  await db.query(
    `INSERT INTO artwork (id, artist_id, slug, titulo, preco_centavos, quantidade_estoque, situacao)
     VALUES (gen_random_uuid(), $1, 'demo-minhocao', 'Minhocão', 120000, 1, 'DISPONIVEL')`,
    [marinaArtista.rows[0]?.id],
  );
  await db.query(
    `INSERT INTO tattoo_style (id, nome, slug) VALUES (gen_random_uuid(), 'Blackwork', 'demo-blackwork')`,
  );
  await db.query(
    `INSERT INTO artist_style (artist_id, tattoo_style_id)
     SELECT a.id, s.id FROM artist a, tattoo_style s
     WHERE a.slug = 'artista-exemplo' AND s.slug = 'demo-blackwork'`,
  );
  await db.query(
    `INSERT INTO portfolio_item (id, artist_id, titulo, imagem_url, ordem)
     SELECT '00000000-0000-4000-9000-000000000007', a.id, 'Mandala geométrica', 'portfolio/x.webp', 1
     FROM artist a WHERE a.slug = 'artista-exemplo'`,
  );

  rodar("npm run db:seed:demo");
  rodar("npm run db:seed:demo");

  const artistas = await db.query<{ papel: string; nome: string; instagram: string | null }>(
    `SELECT u.papel::text AS papel, u.nome, a.instagram FROM artist a
     JOIN "user" u ON u.id = a.user_id WHERE a.slug <> 'artista-exemplo' ORDER BY u.nome`,
  );
  expect(artistas.rows).toEqual([
    { papel: "ARTISTA", nome: 'Gustavo Henrique "Cogu"', instagram: "co.guh" },
    { papel: "ARTISTA", nome: 'Laura Manoel "Pucca"', instagram: "pucca.ink" },
    { papel: "ARTISTA", nome: "Melanie Schwark", instagram: "melanfetamina" },
    { papel: "ARTISTA", nome: "Rafael Lotufo", instagram: "rafa.lotufo" },
  ]);
  const semMarina = await db.query(`SELECT 1 FROM "user" WHERE email = 'marina.duarte@kolo.test'`);
  expect(semMarina.rows).toEqual([]);
  // A conta de teste do db:seed ("Artista") não é do Kolô: sai da gestão do portfólio e da vitrine.
  const exemplo = await db.query<{ excluida: boolean; situacao: string }>(
    `SELECT excluido_em IS NOT NULL AS excluida, situacao::text AS situacao FROM "user"
     WHERE email = 'artista@kolo.test'`,
  );
  expect(exemplo.rows).toEqual([{ excluida: true, situacao: "INATIVO" }]);

  const estilos = await db.query<{ slug: string; artista: string }>(
    `SELECT s.slug, a.slug AS artista FROM tattoo_style s
     JOIN artist_style x ON x.tattoo_style_id = s.id JOIN artist a ON a.id = x.artist_id
     ORDER BY s.slug, a.slug`,
  );
  expect(estilos.rows).toEqual([
    { slug: "blackwork", artista: "cogu" },
    { slug: "blackwork", artista: "melanie-schwark" },
    { slug: "lettering", artista: "pucca" },
    { slug: "old-school", artista: "cogu" },
    { slug: "realismo", artista: "pucca" },
    { slug: "surrealismo", artista: "melanie-schwark" },
  ]);
  const legado = await db.query(
    `SELECT slug FROM artwork WHERE slug LIKE 'demo-%'
     UNION ALL SELECT slug FROM tattoo_style WHERE slug LIKE 'demo-%'
     UNION ALL SELECT id::text FROM portfolio_item`,
  );
  expect(legado.rows).toEqual([]);

  const obras = await db.query<{ slug: string; situacao: string; estoque: number; aviso: boolean }>(
    `SELECT slug, situacao::text AS situacao, quantidade_estoque AS estoque,
            descricao LIKE '%preço e disponibilidade fictícios%' AS aviso
     FROM artwork ORDER BY slug`,
  );
  expect(obras.rows).toHaveLength(11);
  expect(obras.rows.every((obra) => obra.aviso)).toBe(true);
  expect(obras.rows.find((obra) => obra.slug === "cogu-zoe")).toMatchObject({
    situacao: "ESGOTADA",
    estoque: 0,
  });
  expect(obras.rows.filter((obra) => obra.situacao === "DISPONIVEL")).toHaveLength(10);
}, 120_000);

// PBI-49 (lacuna 1): com o seed de demonstração no banco, popular.ts liga todas as imagens. Com
// R2_PUBLIC_URL relativa ele grava em public/<pasta>, sem R2.
it("PBI-49 popular.ts liga uma imagem a cada obra e cria as 19 tatuagens, sem duplicar ao repetir", async () => {
  const pasta = join(process.cwd(), "public", PASTA_LOCAL);
  try {
    rodar("npm run db:seed:demo");
    // Obra cuja imagem antiga ficou na pasta de outro artista: a nova vira a principal.
    await db.query(
      `INSERT INTO artwork_image (id, artwork_id, url, ordem, principal)
       SELECT gen_random_uuid(), id, 'obras/00000000-0000-4000-8000-0000000000aa/rafael-eclipse.webp', 1, true
       FROM artwork WHERE slug = 'rafael-eclipse'`,
    );
    // Tatuagem que já estava com outro artista (artista-exemplo) e é da Pucca.
    await db.query(
      `INSERT INTO portfolio_item (id, artist_id, titulo, descricao, imagem_url, ordem)
       SELECT '00000000-0000-4000-9100-000000000007', a.id, 'Amor', 'Antiga.',
              'portfolio/' || a.id || '/00000000-0000-4000-9100-000000000007.webp', 1
       FROM artist a WHERE a.slug = 'artista-exemplo'`,
    );
    rodar("npx tsx prisma/imagens-demo/popular.ts", { R2_PUBLIC_URL: `/${PASTA_LOCAL}` });
    const amor = await db.query<{ artista: string; dono: boolean; estilos: string }>(
      `SELECT a.slug AS artista, p.imagem_url LIKE 'portfolio/' || a.id || '/%' AS dono,
              (SELECT string_agg(s.slug, ',') FROM portfolio_item_style x
               JOIN tattoo_style s ON s.id = x.tattoo_style_id WHERE x.portfolio_item_id = p.id) AS estilos
       FROM portfolio_item p JOIN artist a ON a.id = p.artist_id
       WHERE p.id = '00000000-0000-4000-9100-000000000007'`,
    );
    expect(amor.rows).toEqual([{ artista: "pucca", dono: true, estilos: "lettering" }]);
    const doExemplo = await db.query(
      `SELECT 1 FROM portfolio_item p JOIN artist a ON a.id = p.artist_id
       WHERE a.slug = 'artista-exemplo'`,
    );
    expect(doExemplo.rows).toEqual([]);
    rodar("npx tsx prisma/imagens-demo/popular.ts", { R2_PUBLIC_URL: `/${PASTA_LOCAL}` });

    const imagens = await db.query<{
      slug: string;
      principal: boolean;
      url: string;
      artista: string;
    }>(
      `SELECT a.slug, i.principal, i.url, a.artist_id::text AS artista FROM artwork_image i
       JOIN artwork a ON a.id = i.artwork_id ORDER BY a.slug`,
    );
    expect(imagens.rows).toHaveLength(11);
    expect(imagens.rows.every((imagem) => imagem.principal)).toBe(true);
    for (const imagem of imagens.rows) {
      expect(imagem.url, imagem.slug).toBe(`obras/${imagem.artista}/${imagem.slug}.webp`);
    }

    const tatuagens = await db.query<{ total: string }>(
      "SELECT count(*)::text AS total FROM portfolio_item",
    );
    expect(tatuagens.rows).toEqual([{ total: "19" }]);

    const primeira = imagens.rows[0];
    if (!primeira) throw new Error("Nenhuma imagem gravada");
    expect(existsSync(join(pasta, primeira.url))).toBe(true);
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
}, 180_000);

// Obra de IA que alguém pôs no carrinho ou comprou: o banco protege (Restrict). O seed não pode
// parar; ela sai do catálogo como excluída, sem ser apagada.
it("db:seed:demo tira do catálogo a obra de IA presa a um carrinho, sem falhar", async () => {
  await db.query(
    `INSERT INTO artwork (id, artist_id, slug, titulo, preco_centavos, quantidade_estoque, situacao)
     SELECT gen_random_uuid(), a.id, 'demo-raizes', 'Raízes', 420000, 1, 'DISPONIVEL'
     FROM artist a WHERE a.slug = 'artista-exemplo'`,
  );
  await db.query(
    `WITH c AS (INSERT INTO cart (id, cookie_token, atualizado_em)
                VALUES (gen_random_uuid(), 'carrinho-pbi49', NOW()) RETURNING id)
     INSERT INTO cart_item (id, cart_id, artwork_id, quantidade)
     SELECT gen_random_uuid(), c.id, o.id, 1 FROM c, artwork o WHERE o.slug = 'demo-raizes'`,
  );

  rodar("npm run db:seed:demo");

  const raizes = await db.query<{ excluida: boolean }>(
    "SELECT excluido_em IS NOT NULL AS excluida FROM artwork WHERE slug = 'demo-raizes'",
  );
  expect(raizes.rows).toEqual([{ excluida: true }]);
}, 120_000);

// A conta da Marina com histórico que o banco protege (e-mail enviado, pedido): o seed não pode
// parar no meio. Ela sai da vitrine sem ser apagada.
it("PBI-49 db:seed:demo tira da vitrine a artista antiga que tem histórico, sem falhar", async () => {
  const marina = await db.query<{ id: string }>(
    `INSERT INTO "user" (id, papel, nome, email, atualizado_em)
     VALUES (gen_random_uuid(), 'ARTISTA', 'Marina Duarte', 'marina.duarte@kolo.test', NOW())
     RETURNING id`,
  );
  const userId = marina.rows[0]?.id;
  await db.query(
    `INSERT INTO artist (id, user_id, slug) VALUES (gen_random_uuid(), $1, 'demo-marina-duarte')`,
    [userId],
  );
  await db.query(
    `INSERT INTO artist_style (artist_id, tattoo_style_id)
     SELECT a.id, s.id FROM artist a, tattoo_style s
     WHERE a.slug = 'demo-marina-duarte' AND s.slug = 'lettering'`,
  );
  await db.query(
    `INSERT INTO email_log (id, user_id, destinatario, template, situacao)
     VALUES (gen_random_uuid(), $1, 'marina.duarte@kolo.test', 'redefinir-senha', 'ENVIADO')`,
    [userId],
  );

  rodar("npm run db:seed:demo");

  const conta = await db.query<{ excluida: boolean; estilos: number }>(
    `SELECT u.excluido_em IS NOT NULL AS excluida,
            (SELECT count(*)::int FROM artist_style x WHERE x.artist_id = a.id) AS estilos
     FROM "user" u JOIN artist a ON a.user_id = u.id WHERE u.id = $1`,
    [userId],
  );
  expect(conta.rows).toEqual([{ excluida: true, estilos: 0 }]);
}, 120_000);

// Demonstração na banca: cada artista entra com a senha do .env (SEED_SENHA_<NOME>). Como a do
// admin, o seed só cria a credencial que falta e nunca troca uma senha que já existe.
it("db:seed:demo dá login ao artista com SEED_SENHA_* e não troca a senha ao repetir", async () => {
  const { verifyPassword } = await import("better-auth/crypto");
  rodar("npm run db:seed:demo", { SEED_SENHA_MELANIE: "senha-demo-melanie-1" });
  rodar("npm run db:seed:demo", { SEED_SENHA_MELANIE: "outra-senha-melanie-2" });

  const credenciais = await db.query<{ email: string; hash: string }>(
    `SELECT u.email, a.senha_hash AS hash FROM account a JOIN "user" u ON u.id = a.user_id
     WHERE u.email IN ('melanie@kolo.test', 'rafael@kolo.test') AND a.provedor = 'credential'`,
  );
  expect(credenciais.rows.map((c) => c.email)).toEqual(["melanie@kolo.test"]);
  const hash = credenciais.rows[0]?.hash ?? "";
  expect(await verifyPassword({ hash, password: "senha-demo-melanie-1" })).toBe(true);
}, 120_000);
