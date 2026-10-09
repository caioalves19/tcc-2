// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Cabecalho } from "@/components/layout/cabecalho";

afterEach(cleanup);

describe("Cabeçalho", () => {
  it("mostra a navegação do site", () => {
    render(<Cabecalho />);
    const navegacao = screen.getByRole("navigation", { name: /principal/i });
    expect(navegacao).toBeDefined();
  });

  it("no mobile, o menu começa fechado e abre no clique", async () => {
    const usuario = userEvent.setup();
    render(<Cabecalho />);

    const botao = screen.getByRole("button", { name: /abrir menu/i });
    expect(botao.getAttribute("aria-expanded")).toBe("false");

    await usuario.click(botao);
    expect(screen.getByRole("button", { name: /fechar menu/i }).getAttribute("aria-expanded")).toBe(
      "true",
    );
  });

  it("fecha o menu ao clicar num link", async () => {
    const usuario = userEvent.setup();
    render(<Cabecalho />);

    await usuario.click(screen.getByRole("button", { name: /abrir menu/i }));
    const menu = screen.getByRole("navigation", { name: /menu mobile/i });
    await usuario.click(within(menu).getByRole("link", { name: "Obras" }));

    expect(screen.getByRole("button", { name: /abrir menu/i }).getAttribute("aria-expanded")).toBe(
      "false",
    );
  });

  it("deslogado: mostra Entrar apontando para /login e nenhum Sair", () => {
    render(<Cabecalho />);

    expect(screen.getByRole("link", { name: "Entrar" }).getAttribute("href")).toBe("/login");
    expect(screen.queryByRole("button", { name: "Sair" })).toBeNull();
  });

  it("logado: mostra Sair, que chama a action de logout", async () => {
    const usuario = userEvent.setup();
    const acaoSair = vi.fn().mockResolvedValue(undefined);
    render(<Cabecalho logado acaoSair={acaoSair} />);

    expect(screen.queryByRole("link", { name: "Entrar" })).toBeNull();
    expect(screen.getByRole("link", { name: "Minha conta" }).getAttribute("href")).toBe("/conta");
    await usuario.click(screen.getByRole("button", { name: "Sair" }));

    expect(acaoSair).toHaveBeenCalledOnce();
  });
});

it("RF28 mostra acesso à administração para ADMIN também no menu mobile", async () => {
  const usuario = userEvent.setup();
  const { rerender } = render(<Cabecalho logado />);
  expect(screen.queryByRole("link", { name: "Administração" })).toBeNull();
  rerender(<Cabecalho logado administrador />);
  expect(screen.getByRole("link", { name: "Administração" }).getAttribute("href")).toBe("/admin");
  await usuario.click(screen.getByRole("button", { name: /abrir menu/i }));
  expect(
    within(screen.getByRole("navigation", { name: /menu mobile/i }))
      .getByRole("link", { name: "Administração" })
      .getAttribute("href"),
  ).toBe("/admin");
});

it("RF22 mostra a agenda para a equipe (artista ou admin), também no menu mobile", async () => {
  const usuario = userEvent.setup();
  const { rerender } = render(<Cabecalho logado />);
  expect(screen.queryByRole("link", { name: "Agenda" })).toBeNull();
  rerender(<Cabecalho logado equipe />);
  expect(screen.getByRole("link", { name: "Agenda" }).getAttribute("href")).toBe("/agenda");
  await usuario.click(screen.getByRole("button", { name: /abrir menu/i }));
  expect(
    within(screen.getByRole("navigation", { name: /menu mobile/i }))
      .getByRole("link", { name: "Agenda" })
      .getAttribute("href"),
  ).toBe("/agenda");
});

it("RF11 o carrinho do cabeçalho leva a /carrinho e diz quantos itens tem", () => {
  render(<Cabecalho itensNoCarrinho={2} />);
  const carrinho = screen.getByRole("link", { name: "Carrinho, 2 itens" });
  expect(carrinho.getAttribute("href")).toBe("/carrinho");
  expect(carrinho.textContent).toContain("2");
  cleanup();
  render(<Cabecalho />);
  expect(screen.getByRole("link", { name: "Carrinho" }).getAttribute("href")).toBe("/carrinho");
});
