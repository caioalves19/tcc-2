// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { AgendaSemana } from "../../src/components/agenda/agenda-semana";

const roteador = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => roteador, unstable_rethrow: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const horario = (extra: Record<string, unknown> = {}) => ({
  id: "h1",
  codigo: "AG-20261012-ABC234",
  artistaId: "ana",
  artistaNome: "Ana",
  nomeContato: "Lucas Silveira",
  telefoneContato: "11987654321",
  emailCliente: null,
  inicio: "2026-10-12T22:00",
  fim: "2026-10-12T23:00",
  situacao: "AGENDADO" as const,
  estiloId: null,
  estiloNome: "Fineline",
  tamanhoId: null,
  tamanhoNome: null,
  regiaoCorpo: "Nuca",
  observacoes: "Primeira sessão",
  ...extra,
});
const dias = (horarios: ReturnType<typeof horario>[]) =>
  ["12", "13", "14", "15", "16", "17", "18"].map((d) => ({
    data: `2026-10-${d}`,
    horarios: horarios.filter((h) => h.inicio.slice(8, 10) === d),
  }));

function montar(
  papel: "ADMIN" | "ARTISTA",
  horarios: ReturnType<typeof horario>[],
  artistaId: string | null = papel === "ARTISTA" ? "ana" : null,
) {
  const acoes = {
    cadastrar: vi.fn().mockResolvedValue({ ok: true, dados: { id: "novo", codigo: "AG-1" } }),
    editar: vi.fn().mockResolvedValue({ ok: true, dados: undefined }),
    mudarSituacao: vi.fn().mockResolvedValue({ ok: true, dados: undefined }),
  };
  render(
    <AgendaSemana
      papel={papel}
      artistaId={artistaId}
      artistas={
        papel === "ADMIN"
          ? [
              { id: "ana", nome: "Ana" },
              { id: "bia", nome: "Bia" },
            ]
          : []
      }
      semana={{
        inicio: "2026-10-12",
        fim: "2026-10-18",
        anterior: "2026-10-05",
        proxima: "2026-10-19",
      }}
      dias={dias(horarios)}
      opcoes={{ estilos: [], tamanhos: [] }}
      {...acoes}
    />,
  );
  return acoes;
}

it("RF22/RN09 mostra a semana de segunda a domingo, com os horários em São Paulo", () => {
  montar("ARTISTA", [
    horario(),
    horario({ id: "h2", inicio: "2026-10-14T10:00", fim: "2026-10-14T12:00" }),
  ]);
  expect(screen.getByRole("heading", { level: 1, name: "Agenda" })).toBeDefined();
  expect(screen.getByText("Semana de 12/10 a 18/10/2026")).toBeDefined();
  const titulos = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
  expect(titulos).toEqual([
    "Segunda, 12/10",
    "Terça, 13/10",
    "Quarta, 14/10",
    "Quinta, 15/10",
    "Sexta, 16/10",
    "Sábado, 17/10",
    "Domingo, 18/10",
  ]);
  const segunda = screen.getByRole("region", { name: "Segunda, 12/10" });
  expect(segunda.textContent).toContain("22:00–23:00");
  expect(segunda.textContent).toContain("Lucas Silveira");
  expect(segunda.textContent).toContain("Fineline");
  expect(segunda.textContent).toContain("Nuca");
  expect(segunda.textContent).toContain("Primeira sessão");
  expect(within(segunda).getByRole("link", { name: "11987654321" }).getAttribute("href")).toBe(
    "tel:+5511987654321",
  );
  // O artista só vê a própria agenda: o nome dele não se repete em cada horário.
  expect(segunda.textContent).not.toContain("Ana");
  expect(screen.getByRole("region", { name: "Terça, 13/10" }).textContent).toContain(
    "Sem horários",
  );
});

it("RF22 navega entre semanas; o admin filtra por artista e o filtro segue na navegação", async () => {
  const usuario = userEvent.setup();
  montar("ADMIN", [horario()], "bia");
  const nav = screen.getByRole("navigation", { name: "Semanas" });
  expect(
    within(nav)
      .getAllByRole("link")
      .map((a) => [a.textContent, a.getAttribute("href")]),
  ).toEqual([
    ["Semana anterior", "/agenda?semana=2026-10-05&artista=bia"],
    ["Esta semana", "/agenda?artista=bia"],
    ["Próxima semana", "/agenda?semana=2026-10-19&artista=bia"],
  ]);
  const filtro = screen.getByLabelText("Artista") as HTMLSelectElement;
  expect(filtro.value).toBe("bia");
  await usuario.selectOptions(filtro, "");
  expect(roteador.push).toHaveBeenCalledWith("/agenda?semana=2026-10-12");
  // Para o admin, cada horário diz de quem é.
  expect(screen.getByRole("region", { name: "Segunda, 12/10" }).textContent).toContain("Ana");
  cleanup();

  montar("ARTISTA", []);
  expect(screen.queryByLabelText("Artista")).toBeNull();
});

it("RF22 só horário agendado tem editar, concluir e cancelar; cancelar atualiza a lista", async () => {
  const usuario = userEvent.setup();
  const acoes = montar("ARTISTA", [
    horario(),
    horario({ id: "h2", nomeContato: "Bruna", inicio: "2026-10-14T10:00", situacao: "CANCELADO" }),
  ]);
  const cancelada = screen.getByRole("region", { name: "Quarta, 14/10" });
  expect(cancelada.textContent).toContain("Cancelado");
  expect(within(cancelada).queryByRole("button")).toBeNull();

  await usuario.click(screen.getByRole("button", { name: "Cancelar o horário de Lucas Silveira" }));
  await waitFor(() =>
    expect(acoes.mudarSituacao).toHaveBeenCalledWith({ id: "h1", situacao: "CANCELADO" }),
  );
  expect(roteador.refresh).toHaveBeenCalled();

  acoes.mudarSituacao.mockResolvedValueOnce({
    ok: false,
    erro: "finalizado",
    mensagem: "Este horário já foi cancelado ou concluído.",
  });
  await usuario.click(screen.getByRole("button", { name: "Concluir o horário de Lucas Silveira" }));
  expect((await screen.findByRole("alert")).textContent).toContain("já foi cancelado ou concluído");
});

it("RF22 novo horário e edição abrem o formulário e atualizam a lista ao salvar", async () => {
  const usuario = userEvent.setup();
  const acoes = montar("ARTISTA", [horario()]);
  await usuario.click(screen.getByRole("button", { name: "Novo horário" }));
  await usuario.click(screen.getByRole("button", { name: "Salvar horário" }));
  await waitFor(() => expect(acoes.cadastrar).toHaveBeenCalledOnce());
  await waitFor(() => expect(roteador.refresh).toHaveBeenCalled());
  expect(screen.queryByRole("button", { name: "Salvar horário" })).toBeNull();

  await usuario.click(screen.getByRole("button", { name: "Editar o horário de Lucas Silveira" }));
  expect((screen.getByLabelText("Nome do contato") as HTMLInputElement).value).toBe(
    "Lucas Silveira",
  );
  await usuario.click(screen.getByRole("button", { name: "Salvar horário" }));
  await waitFor(() =>
    expect(acoes.editar).toHaveBeenCalledWith(expect.objectContaining({ id: "h1" })),
  );
});
