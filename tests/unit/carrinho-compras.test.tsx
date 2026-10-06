// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { CarrinhoCompras } from "../../src/components/loja/carrinho-compras";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  unstable_rethrow: vi.fn(),
}));
afterEach(cleanup);

const item = (extra: Record<string, unknown>) => ({
  obraId: "obra-1",
  titulo: "Metrópole em chamas",
  slug: "metropole-em-chamas",
  artistaNome: "Caio Alves",
  precoCentavos: 480000,
  quantidade: 1,
  estoque: 1,
  disponivel: true,
  chaveMiniatura: "obras/a/1_thumb.webp",
  textoAlternativo: "Tela grafitada",
  ...extra,
});

function montar(
  itens: ReturnType<typeof item>[],
  resumo = { totalCentavos: 0, unidades: 0, indisponiveis: 0 },
) {
  const acoes = {
    alterar: vi.fn().mockResolvedValue({ ok: true, dados: undefined }),
    remover: vi.fn().mockResolvedValue({ ok: true, dados: undefined }),
  };
  render(
    <CarrinhoCompras
      itens={itens}
      {...resumo}
      baseImagens="https://imagens.kolo.test"
      {...acoes}
    />,
  );
  return acoes;
}

it("RF11 mostra o carrinho vazio com caminho de volta", () => {
  montar([]);
  expect(screen.getByRole("heading", { level: 1, name: "Seu carrinho" })).toBeDefined();
  expect(screen.getByText("Seu carrinho está vazio.")).toBeDefined();
  expect(screen.getByRole("link", { name: "Voltar ao início" }).getAttribute("href")).toBe("/");
});

it("RF11 lista as obras com preço e total do servidor, quantidade só para tiragem", async () => {
  const usuario = userEvent.setup();
  const acoes = montar(
    [
      item({}),
      item({
        obraId: "obra-2",
        titulo: "Retalho paulistano",
        precoCentavos: 9990,
        quantidade: 2,
        estoque: 3,
      }),
    ],
    { totalCentavos: 499980, unidades: 3, indisponiveis: 0 },
  );
  const [unica, tiragem] = within(
    screen.getByRole("list", { name: "Obras no carrinho" }),
  ).getAllByRole("listitem");
  if (!unica || !tiragem) throw new Error("Itens não renderizados");
  expect(unica.textContent).toContain("R$ 4.800,00");
  expect(unica.textContent).toContain("Peça única");
  expect(within(unica).queryByRole("combobox")).toBeNull();
  expect(within(unica).getByRole("img", { name: "Tela grafitada" }).getAttribute("src")).toBe(
    "https://imagens.kolo.test/obras/a/1_thumb.webp",
  );
  expect(screen.getByRole("complementary", { name: "Resumo do pedido" }).textContent).toContain(
    "R$ 4.999,80",
  );

  await usuario.selectOptions(
    within(tiragem).getByLabelText("Quantidade de Retalho paulistano"),
    "3",
  );
  await waitFor(() => expect(acoes.alterar).toHaveBeenCalledWith("obra-2", 3));
  await usuario.click(
    within(unica).getByRole("button", { name: "Remover Metrópole em chamas do carrinho" }),
  );
  await waitFor(() => expect(acoes.remover).toHaveBeenCalledWith("obra-1"));
  expect(screen.getByRole("button", { name: "Finalizar compra" })).toHaveProperty("disabled", true);
});

it("RN11 marca a obra indisponível e não oferece quantidade", () => {
  montar([item({ disponivel: false, estoque: 0 })], {
    totalCentavos: 0,
    unidades: 0,
    indisponiveis: 1,
  });
  const unica = within(screen.getByRole("list", { name: "Obras no carrinho" })).getByRole(
    "listitem",
  );
  expect(unica.textContent).toContain("Indisponível");
  expect(within(unica).queryByRole("combobox")).toBeNull();
  expect(
    within(unica).getByRole("button", { name: "Remover Metrópole em chamas do carrinho" }),
  ).toBeDefined();
});
