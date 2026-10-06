import { expect, it } from "vitest";
import { validarImagem } from "../../src/modules/media";

it("RF27 aceita só JPEG, PNG e WebP e rejeita SVG e outros tipos", () => {
  for (const tipo of ["image/jpeg", "image/png", "image/webp"]) {
    expect(validarImagem({ tipo, tamanho: 1024 })).toEqual({ ok: true });
  }
  for (const tipo of ["image/svg+xml", "image/gif", "application/pdf", "text/html", ""]) {
    expect(validarImagem({ tipo, tamanho: 1024 })).toEqual({ ok: false, motivo: "tipo_invalido" });
  }
});

it("RF27 aceita até 5 MB e rejeita arquivo maior, vazio ou de tamanho inválido", () => {
  const cincoMB = 5 * 1024 * 1024;
  expect(validarImagem({ tipo: "image/png", tamanho: cincoMB })).toEqual({ ok: true });
  for (const tamanho of [cincoMB + 1, 0, -1, Number.NaN]) {
    expect(validarImagem({ tipo: "image/png", tamanho })).toEqual({
      ok: false,
      motivo: "tamanho_invalido",
    });
  }
});
