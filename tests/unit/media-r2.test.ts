import { afterEach, expect, it, vi } from "vitest";
import { assinarComR2 } from "../../src/modules/media";

afterEach(() => vi.unstubAllEnvs());

function configurarR2() {
  vi.stubEnv("R2_ACCOUNT_ID", "conta123");
  vi.stubEnv("R2_BUCKET", "kolo-imagens");
  vi.stubEnv("R2_ACCESS_KEY_ID", "chave-de-teste");
  vi.stubEnv("R2_SECRET_ACCESS_KEY", "segredo-de-teste");
}

it("RF27 assina um PUT de 5 minutos no bucket, amarrado ao tipo e ao tamanho declarados", async () => {
  configurarR2();
  const chave = "obras/3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b/abc.jpg";

  const url = new URL(
    await assinarComR2({ chave, tipo: "image/jpeg", tamanho: 2048, expiraEmSegundos: 300 }),
  );

  expect(url.host).toBe("conta123.r2.cloudflarestorage.com");
  expect(url.pathname).toBe(`/kolo-imagens/${chave}`);
  expect(url.searchParams.get("X-Amz-Expires")).toBe("300");
  expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
  const assinados = url.searchParams.get("X-Amz-SignedHeaders")?.split(";") ?? [];
  expect(assinados).toEqual(expect.arrayContaining(["content-length", "content-type"]));
});

it("RF27 falha citando a variável ausente quando o R2 não está configurado", async () => {
  configurarR2();
  vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
  await expect(
    assinarComR2({ chave: "obras/x.jpg", tipo: "image/jpeg", tamanho: 1, expiraEmSegundos: 300 }),
  ).rejects.toThrow("R2_SECRET_ACCESS_KEY");
});

it("RF27 não embute na URL assinada o checksum de corpo vazio calculado pelo SDK", async () => {
  configurarR2();
  const url = new URL(
    await assinarComR2({
      chave: "obras/x/abc.jpg",
      tipo: "image/jpeg",
      tamanho: 2048,
      expiraEmSegundos: 300,
    }),
  );
  const nomes = [...url.searchParams.keys()].map((nome) => nome.toLowerCase());
  expect(nomes.filter((nome) => nome.includes("checksum"))).toEqual([]);
});
