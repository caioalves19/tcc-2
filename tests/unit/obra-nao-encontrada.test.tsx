// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import ObraNaoEncontrada from "@/app/obras/[slug]/not-found";

afterEach(cleanup);

it("RF10 obra inexistente ou fora da vitrine mostra aviso em português com caminho de volta", () => {
  render(<ObraNaoEncontrada />);
  expect(screen.getByRole("heading", { level: 1, name: "Obra não encontrada" })).toBeDefined();
  expect(screen.getByText(/não existe ou não está mais na vitrine/)).toBeDefined();
  expect(screen.getByRole("link", { name: "Voltar ao início" }).getAttribute("href")).toBe("/");
});
