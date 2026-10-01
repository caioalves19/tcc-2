import { describe, expect, it } from "vitest";

import { renderizarRecuperacaoDeSenha } from "@/lib/email";

const LINK = "https://kolo.test/redefinir-senha?token=abc123XYZ";

describe("e-mail de recuperação de senha (RF03)", () => {
  it("leva o link de redefinição e o nome da pessoa, em HTML e em texto", async () => {
    const email = await renderizarRecuperacaoDeSenha({ nome: "Maria Silva", link: LINK });

    expect(email.assunto).toBe("Redefinição de senha · Kolô");
    expect(email.html).toContain(`href="${LINK}"`);
    expect(email.html).toContain("Maria Silva");
    expect(email.texto).toContain(LINK);
    expect(email.texto).toContain("1 hora");
  });

  it("escapa o nome digitado pela pessoa", async () => {
    const email = await renderizarRecuperacaoDeSenha({
      nome: '<script>alert("x")</script>',
      link: LINK,
    });

    expect(email.html).not.toContain("<script>");
  });
});
