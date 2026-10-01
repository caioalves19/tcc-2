import { afterEach, describe, expect, it, vi } from "vitest";

import { escolherEnviador } from "@/lib/email";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("escolha do enviador de e-mail", () => {
  it("com RESEND_API_KEY usa o Resend, em qualquer ambiente", () => {
    expect(escolherEnviador({ NODE_ENV: "production", RESEND_API_KEY: "re_teste" }).provedor).toBe(
      "resend",
    );
    expect(escolherEnviador({ NODE_ENV: "development", RESEND_API_KEY: "re_teste" }).provedor).toBe(
      "resend",
    );
  });

  it("sem chave fora de produção, imprime o e-mail no console do servidor", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const enviador = escolherEnviador({ NODE_ENV: "development" });

    await enviador.enviar({
      para: "maria@kolo.test",
      assunto: "Redefinição de senha · Kolô",
      html: "<p>oi</p>",
      texto: "Abra https://kolo.test/redefinir-senha?token=abc",
    });

    expect(enviador.provedor).toBe("console");
    expect(info.mock.calls.flat().join("\n")).toContain(
      "https://kolo.test/redefinir-senha?token=abc",
    );
  });

  it("sem chave em produção, recusa: o link nunca pode cair no log", () => {
    expect(() => escolherEnviador({ NODE_ENV: "production" })).toThrow(
      "RESEND_API_KEY ausente em produção",
    );
  });
});
