// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import LayoutAdmin from "../../src/app/admin/layout";

const acesso = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock("@/modules/artists", () => ({ verificarAcessoAdmin: acesso }));
afterEach(cleanup);
it("RF06/RF28 não renderiza conteúdo administrativo para visitante ou usuário proibido", async () => {
  acesso.mockResolvedValue({ ok: false, erro: "nao_autenticado", mensagem: "Entre" });
  await expect(LayoutAdmin({ children: <p>Dados privados</p> })).rejects.toThrow("redirect:/login");
  acesso.mockResolvedValue({
    ok: false,
    erro: "proibido",
    mensagem: "Acesso exclusivo de administradores.",
  });
  render(await LayoutAdmin({ children: <p>Dados privados</p> }));
  expect(screen.queryByText("Dados privados")).toBeNull();
  expect(screen.getByRole("alert").textContent).toContain("Acesso exclusivo");
});
it("RF28 apresenta navegação das três gestões para ADMIN", async () => {
  acesso.mockResolvedValue({ ok: true });
  render(await LayoutAdmin({ children: <p>Conteúdo permitido</p> }));
  expect(screen.getByRole("link", { name: "Artistas" }).getAttribute("href")).toBe(
    "/admin/artistas",
  );
  expect(screen.getByRole("link", { name: "Estilos" }).getAttribute("href")).toBe("/admin/estilos");
  expect(screen.getByRole("link", { name: "Tags" }).getAttribute("href")).toBe("/admin/tags");
  expect(screen.getByText("Conteúdo permitido")).toBeTruthy();
});
