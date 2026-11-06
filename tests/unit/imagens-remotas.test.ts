import { expect, it } from "vitest";

import { hostsDeImagem } from "../../src/lib/imagens-remotas";

// PBI-49: com R2_PUBLIC_URL=/seed as imagens são arquivos do próprio site (public/seed), que o
// next/image aceita sem nenhum host remoto liberado.
it("RNF14 com R2_PUBLIC_URL relativa nenhum host remoto é liberado", () => {
  expect(hostsDeImagem("/seed")).toEqual([]);
});

it("RNF14 com o endereço público do R2 só esse host é liberado", () => {
  expect(hostsDeImagem("https://pub-exemplo.r2.dev/")).toEqual([
    { protocol: "https", hostname: "pub-exemplo.r2.dev", port: "", pathname: "/**" },
  ]);
  expect(hostsDeImagem(undefined)).toEqual([]);
});
