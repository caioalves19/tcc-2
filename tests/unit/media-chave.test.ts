import { expect, it } from "vitest";
import { gerarChaveObjeto } from "../../src/modules/media";

const artistId = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";
const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

it("RF27 gera no servidor a chave <destino>/<artistId>/<uuid>.<ext> pelo tipo validado", () => {
  expect(gerarChaveObjeto({ destino: "obras", artistId, tipo: "image/jpeg" })).toMatch(
    new RegExp(`^obras/${artistId}/${uuid}\\.jpg$`),
  );
  expect(gerarChaveObjeto({ destino: "portfolio", artistId, tipo: "image/png" })).toMatch(
    new RegExp(`^portfolio/${artistId}/${uuid}\\.png$`),
  );
  expect(gerarChaveObjeto({ destino: "obras", artistId, tipo: "image/webp" })).toMatch(/\.webp$/);
});

it("RF27 gera chaves distintas e recusa artistId ou tipo que possam alterar o caminho", () => {
  const a = gerarChaveObjeto({ destino: "obras", artistId, tipo: "image/png" });
  const b = gerarChaveObjeto({ destino: "obras", artistId, tipo: "image/png" });
  expect(a).not.toBe(b);

  expect(() =>
    gerarChaveObjeto({ destino: "obras", artistId: "../outro", tipo: "image/png" }),
  ).toThrow();
  expect(() =>
    gerarChaveObjeto({ destino: "obras", artistId: `${artistId}/..`, tipo: "image/png" }),
  ).toThrow();
  expect(() => gerarChaveObjeto({ destino: "obras", artistId, tipo: "image/svg+xml" })).toThrow();
});
