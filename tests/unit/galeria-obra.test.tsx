// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { GaleriaObra } from "../../src/components/loja/galeria-obra";

afterEach(cleanup);

const BASE = "https://imagens.kolo.test";
const IMAGENS = [
  { chave: "obras/ana/frontal.png", textoAlternativo: "Vista frontal", principal: false },
  { chave: "obras/ana/textura.png", textoAlternativo: "Detalhe da textura", principal: true },
  { chave: "obras/ana/assinatura.png", textoAlternativo: "Assinatura no verso", principal: false },
];

// O next/image troca o src pela rota do otimizador (/_next/image?url=...).
const origem = (img: HTMLElement) => decodeURIComponent(img.getAttribute("src") ?? "");

it("RF10 abre na imagem principal, com as miniaturas na ordem cadastrada e texto alternativo", () => {
  render(<GaleriaObra titulo="Metrópole em chamas" imagens={IMAGENS} baseImagens={BASE} />);
  const destaque = screen.getByRole("img", { name: "Detalhe da textura" });
  expect(origem(destaque)).toContain(`${BASE}/obras/ana/textura.png`);

  const miniaturas = within(screen.getByRole("list", { name: "Fotos da obra" })).getAllByRole(
    "button",
  );
  expect(miniaturas.map((b) => b.getAttribute("aria-label"))).toEqual([
    "Ver foto 1 de 3: Vista frontal",
    "Ver foto 2 de 3: Detalhe da textura",
    "Ver foto 3 de 3: Assinatura no verso",
  ]);
  expect(miniaturas.map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "true", "false"]);
});

it("RF10 a miniatura troca a imagem grande, pelo clique e pelo teclado", async () => {
  const usuario = userEvent.setup();
  render(<GaleriaObra titulo="Metrópole em chamas" imagens={IMAGENS} baseImagens={BASE} />);

  await usuario.click(screen.getByRole("button", { name: /Ver foto 1 de 3/ }));
  expect(origem(screen.getByRole("img", { name: "Vista frontal" }))).toContain("frontal.png");

  screen.getByRole("button", { name: /Ver foto 3 de 3/ }).focus();
  await usuario.keyboard("{Enter}");
  const grande = screen.getByRole("img", { name: "Assinatura no verso" });
  expect(origem(grande)).toContain("assinatura.png");
  expect(screen.getByRole("button", { name: /Ver foto 3 de 3/ }).getAttribute("aria-pressed")).toBe(
    "true",
  );
});

it("RF10 sem imagens ou sem o endereço do R2 mostra o espaço reservado; com uma só, sem miniaturas", () => {
  render(<GaleriaObra titulo="Sem fotos" imagens={[]} baseImagens={BASE} />);
  expect(screen.getByText("Sem foto")).toBeDefined();
  cleanup();

  render(<GaleriaObra titulo="Metrópole" imagens={IMAGENS} baseImagens={null} />);
  expect(screen.getByText("Sem foto")).toBeDefined();
  expect(screen.queryByRole("img")).toBeNull();
  cleanup();

  render(<GaleriaObra titulo="Uma foto" imagens={[IMAGENS[0]!]} baseImagens={BASE} />);
  expect(screen.getByRole("img", { name: "Vista frontal" })).toBeDefined();
  expect(screen.queryByRole("list", { name: "Fotos da obra" })).toBeNull();
});
