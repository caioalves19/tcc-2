import type { Client } from "pg";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { prepararContas } from "./contas-pbi17";

let db: Client;
let admin: Headers;
let cliente: Headers;
let ana: Headers;
let idAna: string;
let idBia: string;

beforeAll(async () => {
  ({ db, admin, cliente, ana, idAna, idBia } = await prepararContas("kolo_pbi17_assinatura_test"));
}, 120_000);

afterAll(async () => {
  await db?.end();
});

it("RF27 emite URL assinada de 5 minutos com chave gerada no servidor para operação autorizada", async () => {
  const { solicitarUpload } = await import("../../src/modules/media");
  const assinar = vi.fn(async () => "https://r2.test/assinada?X-Amz-Signature=abc");

  const agora = Date.now();
  const resultado = await solicitarUpload(
    { destino: "obras", artistId: idAna, tipo: "image/jpeg", tamanho: 2048 },
    admin,
    assinar,
  );

  if (!resultado.ok) throw new Error(resultado.mensagem);
  const { url, chave, cabecalhos, expiraEm } = resultado.dados;
  expect(url).toBe("https://r2.test/assinada?X-Amz-Signature=abc");
  expect(chave).toMatch(new RegExp(`^obras/${idAna}/[0-9a-f-]{36}\\.jpg$`));
  expect(cabecalhos).toEqual({ "Content-Type": "image/jpeg" });
  expect(Date.parse(expiraEm) - agora).toBeGreaterThan(4 * 60_000);
  expect(Date.parse(expiraEm) - agora).toBeLessThanOrEqual(5 * 60_000 + 1000);
  expect(assinar).toHaveBeenCalledExactlyOnceWith({
    chave,
    tipo: "image/jpeg",
    tamanho: 2048,
    expiraEmSegundos: 300,
  });
});

it("RF27 não assina arquivo inválido, destino malicioso nem operação sem permissão", async () => {
  const { solicitarUpload } = await import("../../src/modules/media");
  const valido = { destino: "obras", artistId: idAna, tipo: "image/png", tamanho: 1024 } as const;
  const assinar = vi.fn(async () => "https://r2.test/assinada");

  const casos: [string, Parameters<typeof solicitarUpload>[0], Headers, string][] = [
    ["SVG", { ...valido, tipo: "image/svg+xml" }, admin, "tipo_invalido"],
    ["acima de 5 MB", { ...valido, tamanho: 5 * 1024 * 1024 + 1 }, admin, "tamanho_invalido"],
    ["destino fora da lista", { ...valido, destino: "../x" as "obras" }, admin, "destino_invalido"],
    ["visitante", valido, new Headers(), "nao_autenticado"],
    ["CLIENTE", valido, cliente, "proibido"],
    [
      "ARTISTA em outro artista",
      { ...valido, destino: "portfolio", artistId: idBia },
      ana,
      "proibido",
    ],
    ["ARTISTA em obras", valido, ana, "proibido"],
    [
      "artista inexistente",
      { ...valido, artistId: "00000000-0000-4000-8000-000000000000" },
      admin,
      "artista_inexistente",
    ],
  ];
  for (const [, entrada, cabecalhos, erro] of casos) {
    expect(await solicitarUpload(entrada, cabecalhos, assinar)).toMatchObject({ ok: false, erro });
  }
  expect(assinar).not.toHaveBeenCalled();

  expect(await solicitarUpload({ ...valido, destino: "portfolio" }, ana, assinar)).toMatchObject({
    ok: true,
  });
  expect(assinar).toHaveBeenCalledTimes(1);
});

it("RF27 trata falha do provedor sem vazar detalhes internos", async () => {
  const { solicitarUpload } = await import("../../src/modules/media");
  const erro = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const assinar = vi.fn(async () => {
    throw new Error("endpoint https://segredo.r2.cloudflarestorage.com chave AKIA123");
  });

  const resultado = await solicitarUpload(
    { destino: "obras", artistId: idAna, tipo: "image/png", tamanho: 1024 },
    admin,
    assinar,
  );

  expect(resultado).toEqual({
    ok: false,
    erro: "indisponivel",
    mensagem: "Não foi possível enviar agora. Tente novamente.",
  });
  expect(JSON.stringify(erro.mock.calls)).not.toMatch(/segredo|AKIA123/);
  erro.mockRestore();
});

it("RF27 sem assinador injetado, assina com o R2 configurado no ambiente", async () => {
  const { solicitarUpload } = await import("../../src/modules/media");
  vi.stubEnv("R2_ACCOUNT_ID", "conta123");
  vi.stubEnv("R2_BUCKET", "kolo-imagens");
  vi.stubEnv("R2_ACCESS_KEY_ID", "chave-de-teste");
  vi.stubEnv("R2_SECRET_ACCESS_KEY", "segredo-de-teste");

  const resultado = await solicitarUpload(
    { destino: "portfolio", artistId: idAna, tipo: "image/webp", tamanho: 4096 },
    admin,
  );
  vi.unstubAllEnvs();

  if (!resultado.ok) throw new Error(resultado.mensagem);
  const url = new URL(resultado.dados.url);
  expect(url.host).toBe("conta123.r2.cloudflarestorage.com");
  expect(url.pathname).toBe(`/kolo-imagens/${resultado.dados.chave}`);
});

it("RF27 trata entrada malformada da Server Action como erro, sem exceção nem assinatura", async () => {
  const { solicitarUpload } = await import("../../src/modules/media");
  const assinar = vi.fn(async () => "https://r2.test/assinada");
  const lixo: unknown[] = [
    null,
    undefined,
    "obras",
    {},
    { destino: "obras", artistId: {}, tipo: "image/png", tamanho: 1024 },
    { destino: "obras", artistId: idAna, tipo: 7, tamanho: 1024 },
    { destino: "obras", artistId: idAna, tipo: "image/png", tamanho: "1024" },
  ];
  for (const entrada of lixo) {
    const resultado = await solicitarUpload(
      entrada as Parameters<typeof solicitarUpload>[0],
      admin,
      assinar,
    );
    expect(resultado).toMatchObject({ ok: false, erro: "entrada_invalida" });
  }
  expect(assinar).not.toHaveBeenCalled();
});
