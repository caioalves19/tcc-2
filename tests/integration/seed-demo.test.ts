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

// PBI-49: num banco novo o seed de demonstração cria os artistas, os estilos e as obras que o
// popular.ts procura, e repetir o comando não duplica nada. Um banco com a demonstração antiga
// (Marina Duarte, artista-exemplo com estilo) perde as duas na vitrine e as obras mudam de dono.
it("PBI-49 db:seed:demo cadastra os artistas do Kolô, estilos e obras e pode rodar de novo", async () => {
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

  const estilos = await db.query<{ slug: string; artista: string }>(
    `SELECT s.slug, a.slug AS artista FROM tattoo_style s
     JOIN artist_style x ON x.tattoo_style_id = s.id JOIN artist a ON a.id = x.artist_id
     ORDER BY s.slug`,
  );
  expect(estilos.rows).toEqual([
    { slug: "demo-aquarela", artista: "pucca" },
    { slug: "demo-blackwork", artista: "cogu" },
    { slug: "demo-traco-fino", artista: "melanie-schwark" },
  ]);

  const minhocao = await db.query<{ artista: string }>(
    `SELECT a.slug AS artista FROM artwork o JOIN artist a ON a.id = o.artist_id
     WHERE o.slug = 'demo-minhocao'`,
  );
  expect(minhocao.rows).toEqual([{ artista: "cogu" }]);

  const obras = await db.query<{ slug: string; situacao: string; estoque: number; aviso: boolean }>(
    `SELECT slug, situacao::text AS situacao, quantidade_estoque AS estoque,
            descricao LIKE '%ilustrativa gerada por IA%' AS aviso
     FROM artwork ORDER BY slug`,
  );
  expect(obras.rows).toHaveLength(8);
  expect(obras.rows.every((obra) => obra.aviso)).toBe(true);
  expect(obras.rows.find((obra) => obra.slug === "demo-raizes")).toMatchObject({
    situacao: "ESGOTADA",
    estoque: 0,
  });
  expect(obras.rows.filter((obra) => obra.situacao === "DISPONIVEL")).toHaveLength(7);
}, 120_000);

// PBI-49 (lacuna 1): com o seed de demonstração no banco, popular.ts liga todas as imagens. Com
// R2_PUBLIC_URL relativa ele grava em public/<pasta>, sem R2.
it("PBI-49 popular.ts liga uma imagem a cada obra e cria as 9 tatuagens, sem duplicar ao repetir", async () => {
  const pasta = join(process.cwd(), "public", PASTA_LOCAL);
  try {
    rodar("npm run db:seed:demo");
    // Obra que mudou de dono (produção): a imagem antiga está na pasta do artista anterior.
    await db.query(
      `INSERT INTO artwork_image (id, artwork_id, url, ordem, principal)
       SELECT gen_random_uuid(), id, 'obras/00000000-0000-4000-8000-0000000000aa/demo-minhocao.webp', 1, true
       FROM artwork WHERE slug = 'demo-minhocao'`,
    );
    // Tatuagem que já estava no artista-exemplo (produção) e agora é do Cogu.
    await db.query(
      `INSERT INTO portfolio_item (id, artist_id, titulo, descricao, imagem_url, ordem)
       SELECT '00000000-0000-4000-9000-000000000007', a.id, 'Mandala geométrica',
              'Mandala em blackwork com pontilhismo entre as escápulas. Demonstração: imagem ilustrativa gerada por IA, fora do acervo real.',
              'portfolio/' || a.id || '/00000000-0000-4000-9000-000000000007.webp', 1
       FROM artist a WHERE a.slug = 'artista-exemplo'`,
    );
    rodar("npx tsx prisma/imagens-demo/popular.ts", { R2_PUBLIC_URL: `/${PASTA_LOCAL}` });
    const mandala = await db.query<{ artista: string; dono: boolean; estilos: string }>(
      `SELECT a.slug AS artista, p.imagem_url LIKE 'portfolio/' || a.id || '/%' AS dono,
              (SELECT string_agg(s.slug, ',') FROM portfolio_item_style x
               JOIN tattoo_style s ON s.id = x.tattoo_style_id WHERE x.portfolio_item_id = p.id) AS estilos
       FROM portfolio_item p JOIN artist a ON a.id = p.artist_id
       WHERE p.id = '00000000-0000-4000-9000-000000000007'`,
    );
    expect(mandala.rows).toEqual([{ artista: "cogu", dono: true, estilos: "demo-blackwork" }]);
    const doExemplo = await db.query(
      `SELECT 1 FROM portfolio_item p JOIN artist a ON a.id = p.artist_id
       WHERE a.slug = 'artista-exemplo'`,
    );
    expect(doExemplo.rows).toEqual([]);
    // Banco que recebeu o popular.ts antes do aviso: repetir o script acrescenta o aviso.
    await db.query(
      "UPDATE portfolio_item SET descricao = 'Sem aviso.' WHERE id = '00000000-0000-4000-9000-000000000001'",
    );
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
    expect(imagens.rows).toHaveLength(8);
    expect(imagens.rows.every((imagem) => imagem.principal)).toBe(true);
    for (const imagem of imagens.rows) {
      expect(imagem.url, imagem.slug).toBe(`obras/${imagem.artista}/${imagem.slug}.webp`);
    }

    const tatuagens = await db.query<{ total: string; avisos: string }>(
      `SELECT count(*)::text AS total,
              count(*) FILTER (WHERE descricao LIKE '%ilustrativa gerada por IA%')::text AS avisos
       FROM portfolio_item`,
    );
    expect(tatuagens.rows).toEqual([{ total: "9", avisos: "9" }]);

    const primeira = imagens.rows[0];
    if (!primeira) throw new Error("Nenhuma imagem gravada");
    expect(existsSync(join(pasta, primeira.url))).toBe(true);
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
}, 180_000);
