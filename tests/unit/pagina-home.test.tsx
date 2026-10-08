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

it("RF07 a chamada de tatuagem é provisória, pelo WhatsApp com mensagem pronta (o wizard entra no PBI-33)", async () => {
  destaques.mockResolvedValue([]);
  render(await Home());
  expect(screen.getByRole("link", { name: "Agendar tatuagem" }).getAttribute("href")).toBe(
    "#tatuagem",
  );
  const bloco = document.getElementById("tatuagem");
  if (!bloco) throw new Error("A home não tem o bloco #tatuagem");
  expect(bloco.getAttribute("data-brand")).toBe("tattoo");
  // RF23 a RF25: o site não marca horário; anamnese e termo acontecem no estúdio.
  expect(bloco.textContent).toMatch(/anamnese/i);
  expect(bloco.textContent).toMatch(/termo de consentimento/i);
  const zap = within(bloco).getByRole("link", { name: "Agendar pelo WhatsApp" });
  expect(zap.getAttribute("href")).toBe(
    `${ZAP}${encodeURIComponent("Olá! Quero agendar uma tatuagem no Kolô.")}`,
  );
  expect(zap.getAttribute("target")).toBe("_blank");
  expect(document.querySelector('a[href^="/agendamento"]')).toBeNull();

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
