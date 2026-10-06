import sharp from "sharp";
import type { Client } from "pg";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import type { Armazenamento } from "../../src/modules/media";
import { prepararContas } from "./contas-pbi17";

let db: Client;
let admin: Headers;
let cliente: Headers;
let ana: Headers;
let idAna: string;
let idBia: string;

beforeAll(async () => {
  ({ db, admin, cliente, ana, idAna, idBia } = await prepararContas(
    "kolo_pbi17_processamento_test",
  ));
}, 120_000);

afterAll(async () => {
  await db?.end();
});

const UUID = "7c1d0f52-3b0a-4f0e-9c55-0a1b2c3d4e5f";

async function armazenamentoCom(chave: string) {
  const original = await sharp({
    create: { width: 800, height: 600, channels: 3, background: "#2c3e50" },
  })
    .png()
    .toBuffer();
  const objetos = new Map<string, Buffer>([[chave, original]]);
  const armazenamento: Armazenamento = {
    obter: vi.fn(async (c: string) => {
      const objeto = objetos.get(c);
      if (!objeto) throw new Error("inexistente");
      return objeto;
    }),
    gravar: vi.fn(async (c: string, corpo: Buffer) => void objetos.set(c, corpo)),
    remover: vi.fn(async (c: string) => void objetos.delete(c)),
  };
  return { armazenamento, objetos };
}

it("RF27 gera a miniatura do objeto que o próprio usuário enviou e do de qualquer artista para ADMIN", async () => {
  const { processarImagem } = await import("../../src/modules/media");
  const chave = `portfolio/${idAna}/${UUID}.png`;
  const { armazenamento, objetos } = await armazenamentoCom(chave);

  expect(await processarImagem(chave, ana, armazenamento)).toEqual({
    ok: true,
    dados: { chaveMiniatura: `portfolio/${idAna}/${UUID}_thumb.webp` },
  });
  expect(objetos.has(`portfolio/${idAna}/${UUID}_thumb.webp`)).toBe(true);

  expect(await processarImagem(chave, admin, armazenamento)).toMatchObject({ ok: true });
});

it("RF27 não toca no armazenamento sem permissão ou com chave fora do formato gerado pelo servidor", async () => {
  const { processarImagem } = await import("../../src/modules/media");
  const deAna = `obras/${idAna}/${UUID}.png`;
  const { armazenamento } = await armazenamentoCom(deAna);

  const casos: [string, string, Headers, string][] = [
    ["visitante", deAna, new Headers(), "nao_autenticado"],
    ["CLIENTE", deAna, cliente, "proibido"],
    ["artista de outro perfil", `obras/${idBia}/${UUID}.png`, ana, "proibido"],
    ["chave de miniatura", `obras/${idAna}/${UUID}_thumb.webp`, ana, "chave_invalida"],
    ["caminho com ..", `obras/${idAna}/../${idBia}/${UUID}.png`, ana, "chave_invalida"],
    ["destino fora da lista", `outros/${idAna}/${UUID}.png`, ana, "chave_invalida"],
    ["extensão não aceita", `obras/${idAna}/${UUID}.svg`, ana, "chave_invalida"],
  ];
  for (const [, chave, cabecalhos, erro] of casos) {
    expect(await processarImagem(chave, cabecalhos, armazenamento)).toMatchObject({
      ok: false,
      erro,
    });
  }
  expect(armazenamento.obter).not.toHaveBeenCalled();
  expect(armazenamento.gravar).not.toHaveBeenCalled();
  expect(armazenamento.remover).not.toHaveBeenCalled();
});

it("RF27 devolve erro tratado quando o R2 não está configurado e a imagem inválida some do bucket", async () => {
  const { processarImagem } = await import("../../src/modules/media");
  const erro = vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.stubEnv("R2_ACCOUNT_ID", "");
  const chave = `obras/${idAna}/${UUID}.png`;

  expect(await processarImagem(chave, ana)).toMatchObject({ ok: false, erro: "indisponivel" });

  vi.unstubAllEnvs();
  erro.mockRestore();
  const { armazenamento, objetos } = await armazenamentoCom(chave);
  objetos.set(chave, Buffer.from("<html></html>"));
  expect(await processarImagem(chave, ana, armazenamento)).toMatchObject({
    ok: false,
    erro: "imagem_invalida",
  });
  expect(objetos.size).toBe(0);
});
