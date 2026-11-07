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

// PBI-49: num banco novo o seed de demonstração cria o artista, os estilos e as obras que o
// popular.ts procura, e repetir o comando não duplica nada.
it("PBI-49 db:seed:demo cadastra artista, estilos e obras de demonstração e pode rodar de novo", async () => {
  rodar("npm run db:seed:demo");
  rodar("npm run db:seed:demo");

  const artista = await db.query<{ papel: string; nome: string }>(
    `SELECT u.papel::text AS papel, u.nome FROM artist a JOIN "user" u ON u.id = a.user_id
     WHERE a.slug = 'demo-marina-duarte'`,
  );
  expect(artista.rows).toEqual([{ papel: "ARTISTA", nome: "Marina Duarte" }]);

  const estilos = await db.query<{ slug: string; artista: string }>(
    `SELECT s.slug, a.slug AS artista FROM tattoo_style s
     JOIN artist_style x ON x.tattoo_style_id = s.id JOIN artist a ON a.id = x.artist_id
     ORDER BY s.slug`,
  );
  expect(estilos.rows).toEqual([
    { slug: "demo-aquarela", artista: "demo-marina-duarte" },
    { slug: "demo-blackwork", artista: "artista-exemplo" },
    { slug: "demo-traco-fino", artista: "demo-marina-duarte" },
  ]);

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
    rodar("npx tsx prisma/imagens-demo/popular.ts", { R2_PUBLIC_URL: `/${PASTA_LOCAL}` });
    // Banco que recebeu o popular.ts antes do aviso: repetir o script acrescenta o aviso.
    await db.query(
      "UPDATE portfolio_item SET descricao = 'Sem aviso.' WHERE id = '00000000-0000-4000-9000-000000000001'",
    );
    rodar("npx tsx prisma/imagens-demo/popular.ts", { R2_PUBLIC_URL: `/${PASTA_LOCAL}` });

    const imagens = await db.query<{ slug: string; principal: boolean; url: string }>(
      `SELECT a.slug, i.principal, i.url FROM artwork_image i JOIN artwork a ON a.id = i.artwork_id
       ORDER BY a.slug`,
    );
    expect(imagens.rows).toHaveLength(8);
    expect(imagens.rows.every((imagem) => imagem.principal)).toBe(true);

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
