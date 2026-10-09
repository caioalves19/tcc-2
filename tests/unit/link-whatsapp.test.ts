import { describe, expect, it } from "vitest";

import { linkWhatsApp } from "@/lib/contato";

describe("PBI-21: chamada provisória pelo WhatsApp", () => {
  it("usa o número do ateliê e leva a mensagem pronta, codificada", () => {
    expect(linkWhatsApp("Olá! Quero agendar uma tatuagem & tirar dúvidas?")).toBe(
      "https://wa.me/5511950901191?text=Ol%C3%A1!%20Quero%20agendar%20uma%20tatuagem%20%26%20tirar%20d%C3%BAvidas%3F",
    );
  });
});
