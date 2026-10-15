// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import { Rodape } from "@/components/layout/rodape";
import { PADRAO, type ConfiguracaoSite } from "@/modules/settings";

afterEach(cleanup);

const CONFIGURADO: ConfiguracaoSite = {
  contato: {
    email: "contato@kolo.test",
    whatsapp: "5511912345678",
    instagramAtelie: "kolo.atelie",
    instagramTattoo: "kolo.tattoo",
  },
  horarios: ["Ter a sex, 10h às 19h", "Sáb, 10h às 16h"],
  textos: { ...PADRAO.textos, rodape: "Arte urbana feita por pessoas reais." },
};

it("RF08 liga as três políticas no rodapé, com nomes acessíveis", () => {
  render(<Rodape configuracao={PADRAO} />);
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

it("RF31 sem nada salvo, o rodapé mostra o contato de sempre e nenhum horário", () => {
  render(<Rodape configuracao={PADRAO} />);
  const contato = within(screen.getByRole("navigation", { name: "Contato" }));
  expect(contato.getByRole("link", { name: "ateliekolo@gmail.com" }).getAttribute("href")).toBe(
    "mailto:ateliekolo@gmail.com",
  );
  expect(contato.getByRole("link", { name: "WhatsApp" }).getAttribute("href")).toBe(
    "https://wa.me/5511950901191",
  );
  expect(contato.getByRole("link", { name: "@koloatelie" }).getAttribute("href")).toBe(
    "https://instagram.com/koloatelie",
  );
  expect(
    screen.getByText("Arte urbana autêntica, feita por pessoas reais. São Paulo."),
  ).toBeDefined();
  expect(screen.queryByRole("heading", { name: "Horários" })).toBeNull();
});

it("RF31 o rodapé mostra o contato, os horários e a frase configurados", () => {
  render(<Rodape configuracao={CONFIGURADO} />);
  const contato = within(screen.getByRole("navigation", { name: "Contato" }));
  expect(contato.getByRole("link", { name: "contato@kolo.test" }).getAttribute("href")).toBe(
    "mailto:contato@kolo.test",
  );
  expect(contato.getByRole("link", { name: "WhatsApp" }).getAttribute("href")).toBe(
    "https://wa.me/5511912345678",
  );
  expect(contato.getByRole("link", { name: "@kolo.atelie" }).getAttribute("href")).toBe(
    "https://instagram.com/kolo.atelie",
  );
  expect(contato.getByRole("link", { name: "@kolo.tattoo" }).getAttribute("href")).toBe(
    "https://instagram.com/kolo.tattoo",
  );
  const horarios = screen.getByRole("heading", { name: "Horários" }).parentElement;
  expect(
    within(horarios as HTMLElement)
      .getAllByRole("listitem")
      .map((l) => l.textContent),
  ).toEqual(["Ter a sex, 10h às 19h", "Sáb, 10h às 16h"]);
  expect(screen.getByText("Arte urbana feita por pessoas reais.")).toBeDefined();
});
