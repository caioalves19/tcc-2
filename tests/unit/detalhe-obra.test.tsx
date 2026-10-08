// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { DetalheObra } from "../../src/components/loja/detalhe-obra";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  unstable_rethrow: vi.fn(),
}));
afterEach(cleanup);

const BASE = "https://imagens.kolo.test";
const obra = (extra: Record<string, unknown> = {}) => ({
  id: "obra-1",
  slug: "metropole-em-chamas",
  titulo: "Metrópole em chamas",
  descricao: "Camadas de acrílica e spray sobre a Avenida Paulista.",
  tecnica: "Acrílica e spray sobre tela",
  dimensoes: "90 × 70 cm",
  ano: 2024,
  precoCentavos: 285000,
  disponivel: true,
  artista: { id: "ana", nome: "Ana", slug: "ana" },
  imagens: [{ chave: "obras/ana/frontal.png", textoAlternativo: "Vista frontal", principal: true }],
  ...extra,
});
const card = (slug: string, titulo: string) => ({
  slug,
  titulo,
  artistaNome: "Ana",
  tecnica: null,
  dimensoes: null,
  precoCentavos: 100000,
  disponivel: true,
  imagem: null,
});

function montar(dados = obra(), outras: ReturnType<typeof card>[] = []) {
  const adicionar = vi.fn().mockResolvedValue({ ok: true, dados: undefined });
  render(<DetalheObra obra={dados} outras={outras} baseImagens={BASE} adicionar={adicionar} />);
  return adicionar;
}

it("RF10 mostra título, artista, preço, descrição e ficha técnica, e a disponível vai ao carrinho", async () => {
  const usuario = userEvent.setup();
  const adicionar = montar();
  expect(screen.getByRole("heading", { level: 1, name: "Metrópole em chamas" })).toBeDefined();
  expect(screen.getByText(/Obra de/).textContent).toContain("Ana");
  expect(screen.getByText("R$ 2.850,00")).toBeDefined();
  expect(screen.getByText("Disponível")).toBeDefined();
  expect(screen.getByText("Camadas de acrílica e spray sobre a Avenida Paulista.")).toBeDefined();

  const ficha = screen.getByRole("region", { name: "Ficha técnica" });
  const linhas = within(ficha)
    .getAllByRole("term")
    .map((dt) => `${dt.textContent}: ${dt.nextElementSibling?.textContent}`);
  expect(linhas).toEqual([
    "Artista: Ana",
    "Técnica: Acrílica e spray sobre tela",
    "Dimensões: 90 × 70 cm",
    "Ano: 2024",
  ]);

  await usuario.click(screen.getByRole("button", { name: "Adicionar ao carrinho" }));
  await waitFor(() => expect(adicionar).toHaveBeenCalledWith("obra-1"));
});

it("RN11 a esgotada aparece identificada e sem botão de compra; a ficha omite o que não foi cadastrado", () => {
  montar(obra({ disponivel: false, tecnica: null, ano: null, descricao: null }));
  expect(screen.getByText("Esgotada")).toBeDefined();
  expect(screen.queryByText("Disponível")).toBeNull();
  expect(screen.queryByRole("button", { name: "Adicionar ao carrinho" })).toBeNull();
  expect(screen.getByText("R$ 2.850,00")).toBeDefined();
  const ficha = screen.getByRole("region", { name: "Ficha técnica" });
  expect(
    within(ficha)
      .getAllByRole("term")
      .map((dt) => dt.textContent),
  ).toEqual(["Artista", "Dimensões"]);
});

it("RF10 o WhatsApp leva título e artista; a trilha volta ao início e ao catálogo", () => {
  montar();
  const zap = screen.getByRole("link", { name: "Tirar dúvidas com o ateliê pelo WhatsApp" });
  expect(zap.getAttribute("href")).toBe(
    `https://wa.me/5511950901191?text=${encodeURIComponent(
      'Olá! Tenho uma dúvida sobre a obra "Metrópole em chamas", de Ana.',
    )}`,
  );
  expect(zap.getAttribute("target")).toBe("_blank");
  expect(zap.getAttribute("rel")).toContain("noopener");

  const trilha = screen.getByRole("navigation", { name: "Trilha de navegação" });
  expect(
    within(trilha)
      .getAllByRole("link")
      .map((a) => [a.textContent, a.getAttribute("href")]),
  ).toEqual([
    ["Início", "/"],
    ["Obras", "/obras"],
  ]);
  expect(within(trilha).getByText("Metrópole em chamas").getAttribute("aria-current")).toBe("page");
  expect(screen.getByRole("link", { name: "Voltar ao catálogo" }).getAttribute("href")).toBe(
    "/obras",
  );
});

it("RF10 outras obras do artista aparecem em cards; sem outras, a seção some", () => {
  montar(obra(), [card("caos-ordenado", "Caos ordenado"), card("pulso-noturno", "Pulso noturno")]);
  const secao = screen.getByRole("region", { name: "Outras obras de Ana" });
  expect(within(secao).getAllByRole("article")).toHaveLength(2);
  expect(within(secao).getByRole("link", { name: "Caos ordenado" }).getAttribute("href")).toBe(
    "/obras/caos-ordenado",
  );
  cleanup();

  montar(obra(), []);
  expect(screen.queryByRole("region", { name: "Outras obras de Ana" })).toBeNull();
});
