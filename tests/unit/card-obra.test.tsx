// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { CardObra } from "../../src/components/loja/card-obra";

afterEach(cleanup);

const BASE = "https://imagens.kolo.test";
const card = (extra: Record<string, unknown> = {}) => ({
  slug: "tinta-fresca",
  titulo: "Tinta fresca",
  tecnica: "Spray e pigmento",
  dimensoes: "65 × 65 cm",
  precoCentavos: 165000,
  disponivel: true,
  artistaNome: "Caio Alves",
  imagem: { chave: "obras/ana/tinta.png", textoAlternativo: "Letras em verde-limão" },
  ...extra,
});

it("RF10 o card leva à página da obra com foto, ficha resumida e preço", () => {
  render(<CardObra obra={card()} baseImagens={BASE} />);
  const link = screen.getByRole("link", { name: /Tinta fresca/ });
  expect(link.getAttribute("href")).toBe("/obras/tinta-fresca");
  const foto = screen.getByRole("img", { name: "Letras em verde-limão" });
  expect(decodeURIComponent(foto.getAttribute("src") ?? "")).toContain(
    `${BASE}/obras/ana/tinta.png`,
  );
  const artigo = screen.getByRole("article");
  expect(artigo.textContent).toContain("Caio Alves");
  expect(artigo.textContent).toContain("65 × 65 cm · Spray e pigmento");
  expect(artigo.textContent).toContain("R$ 1.650,00");
  expect(artigo.textContent).not.toContain("Esgotada");
});

it("RN11 a esgotada aparece identificada; sem foto ou sem R2, espaço reservado", () => {
  render(
    <CardObra obra={card({ disponivel: false, imagem: null, tecnica: null })} baseImagens={BASE} />,
  );
  const artigo = screen.getByRole("article");
  expect(artigo.textContent).toContain("Esgotada");
  expect(artigo.textContent).toContain("65 × 65 cm");
  expect(artigo.textContent).not.toContain("·");
  expect(screen.getByText("Sem foto")).toBeDefined();
  cleanup();

  render(<CardObra obra={card()} baseImagens={null} />);
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.getByText("Sem foto")).toBeDefined();
});
