// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import { Rodape } from "@/components/layout/rodape";
import { CONTATO } from "@/lib/contato";

afterEach(cleanup);

it("RF08 liga as três políticas no rodapé, com nomes acessíveis", () => {
  render(<Rodape />);
  const politicas = within(screen.getByRole("navigation", { name: "Políticas" }));
  expect(politicas.getByRole("link", { name: "Privacidade" }).getAttribute("href")).toBe(
    "/politicas/privacidade",
  );
  expect(politicas.getByRole("link", { name: "Termos de uso" }).getAttribute("href")).toBe(
    "/politicas/termos",
  );
  expect(
    politicas.getByRole("link", { name: "Política de cancelamento" }).getAttribute("href"),
  ).toBe("/politicas/cancelamento");
});

it("o contato do Kolô fica num lugar só e é o mesmo que o rodapé mostra", () => {
  expect(CONTATO).toEqual({
    email: "ateliekolo@gmail.com",
    whatsapp: "https://wa.me/5511950901191",
  });
  render(<Rodape />);
  const contato = within(screen.getByRole("navigation", { name: "Contato" }));
  expect(contato.getByRole("link", { name: "ateliekolo@gmail.com" }).getAttribute("href")).toBe(
    "mailto:ateliekolo@gmail.com",
  );
  expect(contato.getByRole("link", { name: "WhatsApp" }).getAttribute("href")).toBe(
    "https://wa.me/5511950901191",
  );
});
