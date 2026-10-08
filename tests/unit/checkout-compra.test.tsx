// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { CheckoutCompra } from "../../src/components/loja/checkout-compra";

vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
afterEach(cleanup);

const resumo = {
  itens: [
    {
      obraId: "obra-1",
      titulo: "Metrópole em chamas",
      artistaNome: "Caio Alves",
      quantidade: 1,
      precoCentavos: 285000,
      chaveMiniatura: "obras/a/1_thumb.webp",
      textoAlternativo: "Tela grafitada",
    },
    {
      obraId: "obra-2",
      titulo: "Retalho paulistano",
      artistaNome: "Bia",
      quantidade: 2,
      precoCentavos: 9990,
      chaveMiniatura: null,
      textoAlternativo: "Retalho paulistano",
    },
  ],
  endereco: {
    destinatario: "Lucas Silveira",
    cep: "01327-000",
    logradouro: "Rua Treze de Maio",
    numero: "450",
    complemento: "Apto 82",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    uf: "SP" as const,
  },
  modalidade: "RETIRADA" as const,
  subtotalCentavos: 304980,
  freteCentavos: 0,
  totalCentavos: 304980,
};

function montar(
  finalizar = vi.fn().mockResolvedValue({ ok: false, erro: "falha", mensagem: "x" }),
) {
  render(
    <CheckoutCompra {...resumo} baseImagens="https://imagens.kolo.test" finalizar={finalizar} />,
  );
  return finalizar;
}

it("RF12 mostra endereço, retirada sem custo e o resumo calculado no servidor", () => {
  montar();
  const endereco = screen.getByRole("region", { name: "Endereço de entrega" });
  expect(endereco.textContent).toContain("Lucas Silveira");
  expect(endereco.textContent).toContain("Rua Treze de Maio, 450 — Apto 82");
  expect(endereco.textContent).toContain("Bela Vista, São Paulo / SP");
  expect(endereco.textContent).toContain("CEP 01327-000");
  expect(within(endereco).getByRole("link", { name: "Editar endereço" }).getAttribute("href")).toBe(
    "/conta",
  );

  const entrega = screen.getByRole("radio", { name: /Retirada no ateliê/ });
  expect(entrega).toHaveProperty("checked", true);
  expect(screen.getByRole("region", { name: "Forma de entrega" }).textContent).toContain("Grátis");

  const pedido = screen.getByRole("complementary", { name: "Resumo do pedido" });
  const [primeira, segunda] = within(pedido).getAllByRole("listitem");
  expect(primeira?.textContent).toContain("Metrópole em chamas");
  expect(primeira?.textContent).toContain("R$ 2.850,00");
  expect(segunda?.textContent).toContain("R$ 99,90 × 2");
  expect(within(pedido).getByRole("img", { name: "Tela grafitada" }).getAttribute("src")).toBe(
    "https://imagens.kolo.test/obras/a/1_thumb.webp",
  );
  expect(pedido.textContent).toContain("Subtotal");
  expect(pedido.textContent).toContain("Retirada no ateliê");
  expect(pedido.textContent).toContain("R$ 0,00");
  expect(pedido.textContent).toContain("R$ 3.049,80");
});

it("RF12 finalizar envia só a modalidade e trava o botão enquanto espera", async () => {
  const usuario = userEvent.setup();
  let responder: (valor: unknown) => void = () => {};
  const finalizar = montar(vi.fn(() => new Promise((resolver) => (responder = resolver))));

  await usuario.click(screen.getByRole("button", { name: "Finalizar compra" }));
  expect(finalizar).toHaveBeenCalledWith({ modalidade: "RETIRADA" });
  expect(screen.getByRole("button", { name: "Finalizando…" })).toHaveProperty("disabled", true);
  responder({ ok: false, erro: "falha", mensagem: "Tente novamente." });
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Finalizar compra" })).toHaveProperty(
      "disabled",
      false,
    ),
  );
});

it("RF12 recusa aparece na tela; com obra indisponível, oferece voltar ao carrinho", async () => {
  const usuario = userEvent.setup();
  montar(
    vi.fn().mockResolvedValue({
      ok: false,
      erro: "indisponivel",
      obras: ["obra-1"],
      mensagem: "Algumas obras do carrinho não estão mais disponíveis nessa quantidade.",
    }),
  );
  await usuario.click(screen.getByRole("button", { name: "Finalizar compra" }));
  const alerta = await screen.findByRole("alert");
  expect(alerta.textContent).toContain("não estão mais disponíveis");
  expect(
    within(alerta).getByRole("link", { name: "Voltar ao carrinho" }).getAttribute("href"),
  ).toBe("/carrinho");
});
