// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Marca } from "@/components/layout/marca";
import { Mascote } from "@/components/layout/mascote";

afterEach(cleanup);

describe("Marca", () => {
  it("o selo do Ateliê é uma imagem com texto alternativo (RNF21)", () => {
    render(<Marca />);
    const logo = screen.getByRole("img", { name: "Kolô Ateliê" });
    expect(logo.getAttribute("src")).toBe("/marca/atelie-selo.svg");
  });

  it("o lettering, para fundo escuro, também tem texto alternativo", () => {
    render(<Marca variante="lettering" />);
    const logo = screen.getByRole("img", { name: "Kolô Ateliê" });
    expect(logo.getAttribute("src")).toBe("/marca/atelie-lettering.svg");
  });
});

describe("Mascote", () => {
  it("é decorativo: fica fora da árvore de acessibilidade", () => {
    render(<Mascote marca="tattoo" />);
    expect(screen.queryByRole("img")).toBeNull();
  });
});
