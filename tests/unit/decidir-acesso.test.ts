import { describe, expect, it } from "vitest";

import { decidirAcesso } from "../../src/modules/identity";

describe("decidir acesso por papel (RF06)", () => {
  it("libera /conta para quem está logado e /admin só para ADMIN", () => {
    expect(decidirAcesso(null, "/conta")).toBe("nao_autenticado");
    expect(decidirAcesso(null, "/admin")).toBe("nao_autenticado");

    expect(decidirAcesso("CLIENTE", "/conta")).toBe("permitido");
    expect(decidirAcesso("ARTISTA", "/conta")).toBe("permitido");
    expect(decidirAcesso("ADMIN", "/conta")).toBe("permitido");

    expect(decidirAcesso("CLIENTE", "/admin")).toBe("proibido");
    expect(decidirAcesso("ARTISTA", "/admin")).toBe("proibido");
    expect(decidirAcesso("ADMIN", "/admin")).toBe("permitido");
  });
});
