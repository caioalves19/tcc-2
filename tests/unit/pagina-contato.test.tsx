// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const configuracao = vi.hoisted(() => vi.fn());
vi.mock("@/modules/settings", async (original) => ({
  ...(await original<typeof import("@/modules/settings")>()),
  lerConfiguracao: configuracao,
}));
// O formulário (Turnstile, Server Action) tem testes próprios.
vi.mock("@/app/contato/formulario", () => ({
  FormularioContato: () => <form aria-label="Formulário de contato" />,
}));

import PaginaContato from "@/app/contato/page";
import { PADRAO } from "@/modules/settings";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("RF31 mostra os horários de atendimento configurados", async () => {
  configuracao.mockResolvedValue({
    ...PADRAO,
    horarios: ["Ter a sex, 10h às 19h", "Sáb, 10h às 16h"],
  });
  render(await PaginaContato());
  const horarios = screen.getByRole("region", { name: "Horários de atendimento" });
  expect(
    within(horarios)
      .getAllByRole("listitem")
      .map((l) => l.textContent),
  ).toEqual(["Ter a sex, 10h às 19h", "Sáb, 10h às 16h"]);
  expect(screen.getByRole("form", { name: "Formulário de contato" })).toBeDefined();
});

it("RF31 sem horário salvo, a seção não aparece", async () => {
  configuracao.mockResolvedValue(PADRAO);
  render(await PaginaContato());
  expect(screen.queryByRole("region", { name: "Horários de atendimento" })).toBeNull();
});
