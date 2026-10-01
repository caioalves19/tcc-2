// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import PaginaRedefinirSenha from "@/app/redefinir-senha/page";

afterEach(cleanup);

describe("página de nova senha (RF03)", () => {
  it("sem token na URL (ex.: recarregou a página) pede para abrir o link do e-mail de novo", async () => {
    render(await PaginaRedefinirSenha({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByText(/Abra de novo o link que enviamos por e-mail ou peça um novo\./),
    ).toBeDefined();
    expect(screen.getByRole("link", { name: /pedir novo link/i }).getAttribute("href")).toBe(
      "/esqueci-senha",
    );
  });
});
