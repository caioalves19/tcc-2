// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const destaques = vi.hoisted(() => vi.fn());
vi.mock("@/modules/catalog", () => ({ listarDestaques: destaques }));

import Home from "@/app/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const CARD = {
  slug: "tinta-fresca",
  titulo: "Tinta fresca",
  tecnica: null,
  dimensoes: null,
  precoCentavos: 100000,
  disponivel: true,
  artistaNome: "Ana",
  imagem: null,
};

it("RF07 apresenta o Kolô, leva ao catálogo e mostra os destaques vindos do banco", async () => {
  destaques.mockResolvedValue([CARD]);
  render(await Home());
  expect(destaques).toHaveBeenCalledOnce();
  expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/arte urbana/i);
  expect(screen.getByRole("link", { name: "Ver obras" }).getAttribute("href")).toBe("/obras");
  const vitrine = screen.getByRole("region", { name: "Obras em destaque" });
  expect(within(vitrine).getByRole("link", { name: "Tinta fresca" }).getAttribute("href")).toBe(
    "/obras/tinta-fresca",
  );
  // Promessas do Stitch que o sistema não cumpre (o estoque pode passar de 1).
  expect(document.body.textContent).not.toMatch(/certificado|01\/01|placeholder/i);
});

const ZAP = "https://wa.me/5511950901191?text=";

it("RF07/RF21 a chamada de tatuagem leva ao wizard; os passos terminam no WhatsApp (PBI-33)", async () => {
  destaques.mockResolvedValue([]);
  render(await Home());
  const bloco = document.getElementById("tatuagem");
  if (!bloco) throw new Error("A home não tem o bloco #tatuagem");
  expect(bloco.getAttribute("data-brand")).toBe("tattoo");

  // Topo e bloco levam ao wizard completo; nada abre o WhatsApp direto para tatuagem.
  const chamadas = screen.getAllByRole("link", { name: "Agendar tatuagem" });
  expect(chamadas).toHaveLength(2);
  for (const chamada of chamadas) expect(chamada.getAttribute("href")).toBe("/agendamento");
  expect(within(bloco).getByRole("link", { name: "Agendar tatuagem" })).toBeDefined();
  expect(bloco.querySelector('a[href^="https://wa.me"]')).toBeNull();

  const passos = within(bloco)
    .getAllByRole("listitem")
    .map((passo) => passo.querySelector("h3")?.textContent);
  expect(passos).toEqual([
    "1. Escolha artista e estilo",
    "2. Diga quando prefere",
    "3. Finalize no WhatsApp",
  ]);
  // RF23 a RF25: o site não marca horário; anamnese e termo acontecem no estúdio.
  expect(bloco.textContent).toMatch(/anamnese/i);
  expect(bloco.textContent).toMatch(/termo de consentimento/i);

  const mural = screen.getByRole("link", { name: "Pedir orçamento pelo WhatsApp" });
  expect(mural.getAttribute("href")).toBe(
    `${ZAP}${encodeURIComponent("Olá! Quero pedir um orçamento de mural.")}`,
  );
});

it("RF07 sem destaques, a home segue inteira e sem seção vazia", async () => {
  destaques.mockResolvedValue([]);
  render(await Home());
  expect(screen.queryByRole("region", { name: "Obras em destaque" })).toBeNull();
  expect(screen.queryByText(/em destaque/i)).toBeNull();
  expect(screen.getByRole("link", { name: "Ver obras" }).getAttribute("href")).toBe("/obras");
  expect(screen.getByRole("region", { name: /tatuagem/i })).toBeDefined();
  expect(screen.getByRole("region", { name: /parede branca/i })).toBeDefined();
});

it("RF07 se o banco falhar nos destaques, a home segue no ar sem a seção (como o layout)", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  destaques.mockRejectedValue(new Error("banco fora"));
  render(await Home());
  expect(screen.queryByRole("region", { name: "Obras em destaque" })).toBeNull();
  expect(screen.getByRole("link", { name: "Ver obras" }).getAttribute("href")).toBe("/obras");
  expect(screen.queryByText(/banco fora/)).toBeNull();
  expect(log).toHaveBeenCalledOnce();
  log.mockRestore();
});
