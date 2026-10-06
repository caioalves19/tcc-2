import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: () => new Map([["x-forwarded-for", "203.0.113.44"]]),
}));

const consumirTentativaMock = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  consumirTentativa: consumirTentativaMock,
}));

const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({
  obterPool: () => ({ query: queryMock }),
}));

const turnstileMock = vi.fn();
vi.mock("@/modules/contact/turnstile", () => ({
  verificarTurnstile: turnstileMock,
}));

describe("Ação de contato (PBI-44)", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("salva mensagem válida após passar no Turnstile", async () => {
    consumirTentativaMock.mockResolvedValue({ bloqueado: false });
    turnstileMock.mockResolvedValue(true);
    queryMock.mockResolvedValue({});

    const { enviarContato } = await import("../../src/modules/contact/actions");

    const resultado = await enviarContato({
      nome: "Visitante",
      email: "visitante@kolo.test",
      mensagem: "Gostaria de saber mais sobre agendamentos.",
      tokenTurnstile: "token-bom",
    });

    expect(resultado).toEqual({ ok: true });
    expect(queryMock).toHaveBeenCalledWith(
      "INSERT INTO contact_message (id, nome, email, mensagem) VALUES (gen_random_uuid(), $1, $2, $3)",
      ["Visitante", "visitante@kolo.test", "Gostaria de saber mais sobre agendamentos."]
    );
  });

  it("rejeita entradas inválidas sem consumir rate limit no banco e sem consultar Turnstile", async () => {
    consumirTentativaMock.mockResolvedValue({ bloqueado: false });
    
    const { enviarContato } = await import("../../src/modules/contact/actions");

    const resultado = await enviarContato({
      nome: "V",
      email: "invalido",
      mensagem: "curta",
      tokenTurnstile: "token-bom",
    });

    expect(resultado).toEqual({
      ok: false,
      campos: {
        nome: "Informe seu nome (mínimo de 2 caracteres).",
        email: "Informe um e-mail válido.",
        mensagem: "Escreva uma mensagem (mínimo de 10 caracteres)."
      }
    });
    expect(turnstileMock).not.toHaveBeenCalled();
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("rejeita e devolve mensagem genérica se o Turnstile falhar", async () => {
    consumirTentativaMock.mockResolvedValue({ bloqueado: false });
    turnstileMock.mockResolvedValue(false);

    const { enviarContato } = await import("../../src/modules/contact/actions");

    const resultado = await enviarContato({
      nome: "Bot",
      email: "bot@kolo.test",
      mensagem: "Sou um robô tentando enviar spam.",
      tokenTurnstile: "token-ruim",
    });

    expect(resultado).toEqual({ ok: false, mensagem: "Falha na verificação de segurança." });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("bloqueia por IP após o limite de 3 tentativas", async () => {
    consumirTentativaMock.mockResolvedValue({ bloqueado: true });

    const { enviarContato } = await import("../../src/modules/contact/actions");

    const resultado = await enviarContato({
      nome: "Spammer",
      email: "spam@kolo.test",
      mensagem: "Quero mandar várias mensagens.",
      tokenTurnstile: "token-bom",
    });

    expect(resultado).toEqual({ ok: false, mensagem: "Muitas tentativas. Tente novamente mais tarde." });
    expect(turnstileMock).not.toHaveBeenCalled();
    expect(queryMock).not.toHaveBeenCalled();
  });
});
