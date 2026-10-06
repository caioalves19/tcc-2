import { afterEach, expect, it, vi } from "vitest";
import { urlPublica } from "../../src/modules/media";

afterEach(() => vi.unstubAllEnvs());

it("RF27 monta a URL pública a partir da chave, sem barra duplicada", () => {
  const chave = "obras/3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b/abc.jpg";
  for (const base of ["https://pub-1.r2.dev", "https://pub-1.r2.dev/"]) {
    vi.stubEnv("R2_PUBLIC_URL", base);
    expect(urlPublica(chave)).toBe(`https://pub-1.r2.dev/${chave}`);
  }
});

it("RF27 falha de forma clara quando R2_PUBLIC_URL não está configurada", () => {
  vi.stubEnv("R2_PUBLIC_URL", "");
  expect(() => urlPublica("obras/x.jpg")).toThrow("R2_PUBLIC_URL");
});
