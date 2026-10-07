import { afterEach, expect, it, vi } from "vitest";

import { verificarTurnstile } from "@/modules/contact";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it("recusa o token quando o Turnstile responde que a verificação falhou", async () => {
  vi.stubEnv("TURNSTILE_SECRET_KEY", "segredo-de-teste");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, "error-codes": ["invalid-input-response"] }),
    }),
  );

  expect(await verificarTurnstile({ token: "token-falso", ip: "203.0.113.10" })).toBe(false);
  expect(fetch).toHaveBeenCalledWith(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    expect.objectContaining({ method: "POST" }),
  );
});

it("recusa o token quando o segredo do Turnstile não está configurado", async () => {
  vi.stubEnv("TURNSTILE_SECRET_KEY", "");
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  expect(await verificarTurnstile({ token: "qualquer", ip: "203.0.113.10" })).toBe(false);
  expect(fetchMock).not.toHaveBeenCalled();
});
