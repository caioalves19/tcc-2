// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const configuracao = vi.hoisted(() => vi.fn());
vi.mock("@/modules/settings", async (original) => ({
  ...(await original<typeof import("@/modules/settings")>()),
  lerConfiguracao: configuracao,
}));

import PaginaCancelamento, {
  metadata as metadataCancelamento,
} from "@/app/politicas/cancelamento/page";
import PaginaPrivacidade, {
  metadata as metadataPrivacidade,
} from "@/app/politicas/privacidade/page";
import PaginaTermos, { metadata as metadataTermos } from "@/app/politicas/termos/page";
import { PADRAO } from "@/modules/settings";

beforeEach(() => {
  configuracao.mockResolvedValue(PADRAO);
});
afterEach(cleanup);

function secao(titulo: string) {
  const elemento = screen.getByRole("heading", { level: 2, name: titulo }).closest("section");
  if (!elemento) throw new Error(`A seção "${titulo}" não está dentro de um <section>`);
  return elemento;
}

describe("Política de privacidade", () => {
  it("RF08 tem título na página e na aba do navegador", async () => {
    render(await PaginaPrivacidade());
    expect(
      screen.getByRole("heading", { level: 1, name: "Política de privacidade" }),
    ).toBeDefined();
    expect(metadataPrivacidade.title).toBe("Política de privacidade · Kolô");
  });

  it("RNF17 declara cada dado guardado no banco, com finalidade", async () => {
    render(await PaginaPrivacidade());
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

  it("PBI-44: declara o formulário de contato, a Cloudflare e o limite por IP", async () => {
    render(await PaginaPrivacidade());
    const dados = secao("Quais dados usamos e para quê").textContent ?? "";
    expect(dados).toMatch(/formulário de contato/i);
    expect(dados).toMatch(/nome, e-mail e a mensagem/i);
    expect(dados).toMatch(/3 envios a cada 15 minutos/i);
    expect(secao("Com quem compartilhamos").textContent).toMatch(/Cloudflare.*Turnstile/);
    expect(secao("Por quanto tempo guardamos").textContent).toMatch(/mensagens de contato/i);
  });

  it("RNF18 e RNF10 afirmam que o site não coleta dados de saúde nem do cartão", async () => {
    render(await PaginaPrivacidade());
    const naoColetamos = secao("O que não coletamos").textContent ?? "";
    expect(naoColetamos).toMatch(/saúde/i);
    expect(naoColetamos).toMatch(/anamnese/i);
    expect(naoColetamos).toMatch(/cartão/i);
  });

  it("RN12 e LGPD explicam os direitos, a exclusão pelo site e a ANPD", async () => {
    render(await PaginaPrivacidade());
    const direitos = secao("Seus direitos");
    const texto = direitos.textContent ?? "";
    expect(texto).toMatch(/exclusão/i);
    expect(texto).toMatch(/anonimizad/i);
    expect(texto).toMatch(/Autoridade Nacional de Proteção de Dados/);
    expect(within(direitos).getByRole("link", { name: "Minha conta" }).getAttribute("href")).toBe(
      "/conta",
    );
    // PBI-40: a exclusão é feita pelo próprio cliente, em Minha conta, e não mais por e-mail.
    expect(within(direitos).getByRole("link", { name: "Excluir conta" }).getAttribute("href")).toBe(
      "/conta#excluir-conta",
    );
    expect(
      within(direitos).getByRole("link", { name: "ateliekolo@gmail.com" }).getAttribute("href"),
    ).toBe("mailto:ateliekolo@gmail.com");
  });

  it("explica que os cookies são só os essenciais", async () => {
    render(await PaginaPrivacidade());
    const cookies = secao("Cookies").textContent ?? "";
    expect(cookies).toMatch(/login/i);
    expect(cookies).toMatch(/carrinho/i);
    expect(cookies).toMatch(/não usamos cookies de publicidade/i);
  });
});

describe("Termos de uso", () => {
  it("RF08 tem título na página e na aba do navegador", async () => {
    render(await PaginaTermos());
    expect(screen.getByRole("heading", { level: 1, name: "Termos de uso" })).toBeDefined();
    expect(metadataTermos.title).toBe("Termos de uso · Kolô");
  });

  it("RN01 a RN06 e RN11 explicam conta, estoque, reserva e aprovação do pagamento", async () => {
    render(await PaginaTermos());
    expect(secao("Sua conta").textContent).toMatch(/para comprar/i);
    const compras = secao("Compra de obras").textContent ?? "";
    expect(compras).toMatch(/peça única/i);
    expect(compras).toMatch(/esgotadas/i);
    expect(compras).toMatch(/10 minutos/);
    expect(compras).toMatch(/Pix ou boleto/);
    expect(compras).toMatch(/aprova/);
  });

  it("RN01 e RF23 a RF25: o pedido de tatuagem não marca horário e traz os três avisos", async () => {
    render(await PaginaTermos());
    const tatuagem = secao("Pedido de tatuagem").textContent ?? "";
    expect(tatuagem).toMatch(/não marca horário/i);
    expect(tatuagem).toMatch(/WhatsApp/);
    expect(tatuagem).toMatch(/anamnese/i);
    expect(tatuagem).toMatch(/termo de consentimento/i);
    expect(tatuagem).toMatch(/18 anos/);
  });

  it("protege os direitos autorais e segue o Código de Defesa do Consumidor", async () => {
    render(await PaginaTermos());
    expect(secao("Obras, fotos e direitos autorais").textContent).toMatch(/Lei 9\.610\/1998/);
    expect(secao("Lei aplicável").textContent).toMatch(/Código de Defesa do Consumidor/);
  });
});

describe("Política de cancelamento", () => {
  it("RF08 tem título na página e na aba do navegador", async () => {
    render(await PaginaCancelamento());
    expect(
      screen.getByRole("heading", { level: 1, name: "Política de cancelamento" }),
    ).toBeDefined();
    expect(metadataCancelamento.title).toBe("Política de cancelamento · Kolô");
  });

  it("RN03 e RN06: sem pagamento aprovado nada é cobrado e a obra volta a ficar disponível", async () => {
    render(await PaginaCancelamento());
    const naoPago = secao("Pedido ainda não pago").textContent ?? "";
    expect(naoPago).toMatch(/nada é cobrado/i);
    expect(naoPago).toMatch(/10 minutos/);
    expect(naoPago).toMatch(/Pix/);
    expect(naoPago).toMatch(/boleto/);
  });

  it("garante a desistência em 7 dias do CDC, com reembolso pelo Mercado Pago", async () => {
    render(await PaginaCancelamento());
    const arrependimento = secao("Desistir da compra em até 7 dias").textContent ?? "";
    expect(arrependimento).toMatch(/art\. 49/);
    expect(arrependimento).toMatch(/7 dias/);
    expect(arrependimento).toMatch(/mesmo meio de pagamento/i);
    expect(arrependimento).toMatch(/Mercado Pago/);
  });

  it("deixa remarcação e cancelamento da sessão de tatuagem para a conversa com o artista", async () => {
    render(await PaginaCancelamento());
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
    async (_, Pagina) => {
      render(await Pagina());
      expect(document.body.textContent).not.toMatch(
        /CPF|nota fiscal|Google Calendar|\b3D\b|certificado de autenticidade|lembrete/i,
      );
    },
  );
});

describe("RF31: contato das políticas vem das configurações do site", () => {
  it("o e-mail e o WhatsApp citados e o quadro de dúvidas usam os valores salvos", async () => {
    configuracao.mockResolvedValue({
      ...PADRAO,
      contato: { ...PADRAO.contato, email: "contato@kolo.test", whatsapp: "5511912345678" },
    });
    render(await PaginaPrivacidade());
    const direitos = secao("Seus direitos");
    expect(
      within(direitos).getByRole("link", { name: "contato@kolo.test" }).getAttribute("href"),
    ).toBe("mailto:contato@kolo.test");
    expect(screen.queryByText(/ateliekolo@gmail\.com/)).toBeNull();
    const duvidas = within(screen.getByRole("complementary", { name: "Dúvidas?" }));
    expect(duvidas.getByRole("link", { name: "Falar no WhatsApp" }).getAttribute("href")).toBe(
      "https://wa.me/5511912345678",
    );
    cleanup();

    render(await PaginaTermos());
    expect(
      within(secao("Contato")).getByRole("link", { name: "WhatsApp" }).getAttribute("href"),
    ).toBe("https://wa.me/5511912345678");
  });
});
