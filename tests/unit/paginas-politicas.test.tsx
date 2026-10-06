// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import PaginaCancelamento, {
  metadata as metadataCancelamento,
} from "@/app/politicas/cancelamento/page";
import PaginaPrivacidade, {
  metadata as metadataPrivacidade,
} from "@/app/politicas/privacidade/page";
import PaginaTermos, { metadata as metadataTermos } from "@/app/politicas/termos/page";

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

describe("Termos de uso", () => {
  it("RF08 tem título na página e na aba do navegador", () => {
    render(<PaginaTermos />);
    expect(screen.getByRole("heading", { level: 1, name: "Termos de uso" })).toBeDefined();
    expect(metadataTermos.title).toBe("Termos de uso · Kolô");
  });

  it("RN01 a RN06 e RN11 explicam conta, estoque, reserva e aprovação do pagamento", () => {
    render(<PaginaTermos />);
    expect(secao("Sua conta").textContent).toMatch(/para comprar/i);
    const compras = secao("Compra de obras").textContent ?? "";
    expect(compras).toMatch(/peça única/i);
    expect(compras).toMatch(/esgotadas/i);
    expect(compras).toMatch(/10 minutos/);
    expect(compras).toMatch(/Pix ou boleto/);
    expect(compras).toMatch(/aprova/);
  });

  it("RN01 e RF23 a RF25: o pedido de tatuagem não marca horário e traz os três avisos", () => {
    render(<PaginaTermos />);
    const tatuagem = secao("Pedido de tatuagem").textContent ?? "";
    expect(tatuagem).toMatch(/não marca horário/i);
    expect(tatuagem).toMatch(/WhatsApp/);
    expect(tatuagem).toMatch(/anamnese/i);
    expect(tatuagem).toMatch(/termo de consentimento/i);
    expect(tatuagem).toMatch(/18 anos/);
  });

  it("protege os direitos autorais e segue o Código de Defesa do Consumidor", () => {
    render(<PaginaTermos />);
    expect(secao("Obras, fotos e direitos autorais").textContent).toMatch(/Lei 9\.610\/1998/);
    expect(secao("Lei aplicável").textContent).toMatch(/Código de Defesa do Consumidor/);
  });
});

describe("Política de cancelamento", () => {
  it("RF08 tem título na página e na aba do navegador", () => {
    render(<PaginaCancelamento />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Política de cancelamento" }),
    ).toBeDefined();
    expect(metadataCancelamento.title).toBe("Política de cancelamento · Kolô");
  });

  it("RN03 e RN06: sem pagamento aprovado nada é cobrado e a obra volta a ficar disponível", () => {
    render(<PaginaCancelamento />);
    const naoPago = secao("Pedido ainda não pago").textContent ?? "";
    expect(naoPago).toMatch(/nada é cobrado/i);
    expect(naoPago).toMatch(/10 minutos/);
    expect(naoPago).toMatch(/Pix/);
    expect(naoPago).toMatch(/boleto/);
  });

  it("garante a desistência em 7 dias do CDC, com reembolso pelo Mercado Pago", () => {
    render(<PaginaCancelamento />);
    const arrependimento = secao("Desistir da compra em até 7 dias").textContent ?? "";
    expect(arrependimento).toMatch(/art\. 49/);
    expect(arrependimento).toMatch(/7 dias/);
    expect(arrependimento).toMatch(/mesmo meio de pagamento/i);
    expect(arrependimento).toMatch(/Mercado Pago/);
  });

  it("deixa remarcação e cancelamento da sessão de tatuagem para a conversa com o artista", () => {
    render(<PaginaCancelamento />);
    const tatuagem = secao("Sessões de tatuagem").textContent ?? "";
    expect(tatuagem).toMatch(/não marca horário/i);
    expect(tatuagem).toMatch(/combinad\w* diretamente com o artista/i);
  });
});

describe("As três políticas", () => {
  it.each([
    ["privacidade", PaginaPrivacidade],
    ["termos", PaginaTermos],
    ["cancelamento", PaginaCancelamento],
  ] as const)(
    "%s não promete o que ficou fora da v2.2 nem o que o Stitch inventou",
    (_, Pagina) => {
      render(<Pagina />);
      expect(document.body.textContent).not.toMatch(
        /CPF|nota fiscal|Google Calendar|\b3D\b|certificado de autenticidade|formulário de contato|lembrete/i,
      );
    },
  );
});
