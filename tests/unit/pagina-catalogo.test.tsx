// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

const listar = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/modules/catalog", () => ({ listarCatalogo: listar }));

import PaginaCatalogo, { metadata } from "@/app/obras/page";
import ErroCatalogo from "@/app/obras/error";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const VAZIO = { obras: [], total: 0, pagina: 1, totalPaginas: 0, ordem: "recentes" };
const busca = (valores: Record<string, string | string[]>) => ({
  searchParams: Promise.resolve(valores),
});

it("RF09/RN01 a página é pública e repassa página e ordenação da URL ao catálogo", async () => {
  listar.mockResolvedValue(VAZIO);
  render(await PaginaCatalogo(busca({ pagina: "2", ordem: "menor-preco" })));
  expect(listar).toHaveBeenCalledWith({ pagina: "2", ordem: "menor-preco" });
  expect(screen.getByRole("heading", { level: 1, name: "Catálogo de obras" })).toBeDefined();
  cleanup();

  // Parâmetro repetido na URL: vale o primeiro.
  render(await PaginaCatalogo(busca({ pagina: ["3", "9"], ordem: ["destaque", "x"] })));
  expect(listar).toHaveBeenLastCalledWith({ pagina: "3", ordem: "destaque" });
  expect(metadata.title).toBe("Catálogo de obras · Kolô");
});

it("RF09 falha ao carregar o catálogo mostra aviso e deixa tentar de novo", async () => {
  const usuario = userEvent.setup();
  // retry refaz a requisição ao servidor; reset só limparia o erro no navegador.
  const tentar = vi.fn();
  const limpar = vi.fn();
  render(<ErroCatalogo error={new Error("banco fora")} retry={tentar} reset={limpar} />);
  expect(screen.getByRole("alert").textContent).toContain("Não foi possível carregar o catálogo");
  expect(screen.queryByText("banco fora")).toBeNull();
  await usuario.click(screen.getByRole("button", { name: "Tentar de novo" }));
  expect(tentar).toHaveBeenCalledOnce();
  expect(limpar).not.toHaveBeenCalled();
});
