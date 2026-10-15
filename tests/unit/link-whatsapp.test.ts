import { describe, expect, it } from "vitest";

import { hrefInstagram, hrefWhatsApp, linkWhatsApp } from "@/lib/contato";

describe("RF31: links de contato a partir das configurações do site", () => {
  it("leva a mensagem pronta, codificada, para o número configurado", () => {
    expect(linkWhatsApp("Olá! Quero agendar uma tatuagem & tirar dúvidas?", "5511912345678")).toBe(
      "https://wa.me/5511912345678?text=Ol%C3%A1!%20Quero%20agendar%20uma%20tatuagem%20%26%20tirar%20d%C3%BAvidas%3F",
    );
  });

  it("monta a conversa sem mensagem e o perfil do Instagram", () => {
    expect(hrefWhatsApp("5511912345678")).toBe("https://wa.me/5511912345678");
    expect(hrefInstagram("kolo.atelie")).toBe("https://instagram.com/kolo.atelie");
  });
});
