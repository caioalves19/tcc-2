// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import PaginaPrivacidade, {
  metadata as metadataPrivacidade,
} from "@/app/politicas/privacidade/page";

afterEach(cleanup);

function secao(titulo: string) {
  const elemento = screen.getByRole("heading", { level: 2, name: titulo }).closest("section");
  if (!elemento) throw new Error(`A seção "${titulo}" não está dentro de um <section>`);
  return elemento;
}

describe("Política de privacidade", () => {
  it("RF08 tem título na página e na aba do navegador", () => {
    render(<PaginaPrivacidade />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Política de privacidade" }),
    ).toBeDefined();
    expect(metadataPrivacidade.title).toBe("Política de privacidade · Kolô");
  });

  it("RNF17 declara cada dado guardado no banco, com finalidade", () => {
    render(<PaginaPrivacidade />);
    const dados = secao("Quais dados usamos e para quê").textContent ?? "";
    // Inventário tirado do prisma/schema.prisma: user, session, rate_limit, verification,
    // email_log, address, cart, order, payment e appointment.
    for (const dado of [
      /nome, e-mail e telefone/i,
      /senha/i,
      /endereço IP/i,
      /navegador/i,
      /tentativas/i,
      /recuperação de senha/i,
      /CEP/,
      /carrinho/i,
      /rastreio/i,
      /Mercado Pago/,
      /região do corpo/i,
    ])
      expect(dados).toMatch(dado);
  });

  it("RNF18 e RNF10 afirmam que o site não coleta dados de saúde nem do cartão", () => {
    render(<PaginaPrivacidade />);
    const naoColetamos = secao("O que não coletamos").textContent ?? "";
    expect(naoColetamos).toMatch(/saúde/i);
    expect(naoColetamos).toMatch(/anamnese/i);
    expect(naoColetamos).toMatch(/cartão/i);
  });

  it("RN12 e LGPD explicam os direitos, a exclusão por e-mail e a ANPD", () => {
    render(<PaginaPrivacidade />);
    const direitos = secao("Seus direitos");
    const texto = direitos.textContent ?? "";
    expect(texto).toMatch(/exclusão/i);
    expect(texto).toMatch(/anonimizad/i);
    expect(texto).toMatch(/Autoridade Nacional de Proteção de Dados/);
    expect(within(direitos).getByRole("link", { name: "Minha conta" }).getAttribute("href")).toBe(
      "/conta",
    );
    expect(
      within(direitos).getByRole("link", { name: "ateliekolo@gmail.com" }).getAttribute("href"),
    ).toBe("mailto:ateliekolo@gmail.com");
  });

  it("explica que os cookies são só os essenciais", () => {
    render(<PaginaPrivacidade />);
    const cookies = secao("Cookies").textContent ?? "";
    expect(cookies).toMatch(/login/i);
    expect(cookies).toMatch(/carrinho/i);
    expect(cookies).toMatch(/não usamos cookies de publicidade/i);
  });
});
