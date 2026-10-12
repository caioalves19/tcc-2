import { describe, expect, it } from "vitest";

import { verificarAmbienteDeProducao } from "@/lib/ambiente";

const PRODUCAO_OK = {
  NODE_ENV: "production",
  RESEND_API_KEY: "re_teste",
  BETTER_AUTH_URL: "https://kolo.test",
  APP_URL: "https://kolo.test",
};

describe("checagem do ambiente na subida do servidor", () => {
  it("produção com Resend e URL pública sobe", () => {
    expect(() => verificarAmbienteDeProducao(PRODUCAO_OK)).not.toThrow();
  });

  it("produção sem RESEND_API_KEY não sobe", () => {
    expect(() => verificarAmbienteDeProducao({ ...PRODUCAO_OK, RESEND_API_KEY: "" })).toThrow(
      "RESEND_API_KEY ausente em produção",
    );
  });

  it("produção sem BETTER_AUTH_URL não sobe: os links iriam para localhost", () => {
    expect(() => verificarAmbienteDeProducao({ ...PRODUCAO_OK, BETTER_AUTH_URL: " " })).toThrow(
      "BETTER_AUTH_URL ausente em produção",
    );
  });

  it("produção sem APP_URL em https não sobe: o Mercado Pago não notificaria pagamento", () => {
    for (const APP_URL of [undefined, "", "http://kolo.test"])
      expect(() => verificarAmbienteDeProducao({ ...PRODUCAO_OK, APP_URL })).toThrow(
        "APP_URL precisa ser https em produção",
      );
  });

  it("desenvolvimento sem nada sobe (e-mail no console, URL local)", () => {
    expect(() => verificarAmbienteDeProducao({ NODE_ENV: "development" })).not.toThrow();
  });
});
