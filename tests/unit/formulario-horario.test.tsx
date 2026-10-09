// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { FormularioHorario } from "../../src/components/agenda/formulario-horario";

vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
afterEach(cleanup);

const OPCOES = {
  estilos: [{ id: "estilo-1", nome: "Fineline" }],
  tamanhos: [{ id: "tamanho-1", nome: "Médio" }],
};
const ARTISTAS = [
  { id: "ana", nome: "Ana" },
  { id: "bia", nome: "Bia" },
];

function montar(extra: Partial<Parameters<typeof FormularioHorario>[0]> = {}) {
  const enviar = vi.fn().mockResolvedValue({ ok: true, dados: undefined });
  const aoSalvar = vi.fn();
  render(
    <FormularioHorario
      artistas={[]}
      opcoes={OPCOES}
      enviar={enviar}
      aoSalvar={aoSalvar}
      aoCancelar={vi.fn()}
      {...extra}
    />,
  );
  return { enviar: (extra.enviar as typeof enviar | undefined) ?? enviar, aoSalvar };
}

it("RF22 o artista preenche contato, horário em São Paulo e opcionais, sem escolher artista", async () => {
  const usuario = userEvent.setup();
  const { enviar, aoSalvar } = montar();
  expect(screen.queryByLabelText("Artista")).toBeNull();

  await usuario.type(screen.getByLabelText("Nome do contato"), "Lucas Silveira");
  await usuario.type(screen.getByLabelText("Telefone (com DDD)"), "11987654321");
  await usuario.type(
    screen.getByLabelText("E-mail da conta do cliente (opcional)"),
    "lucas@x.test",
  );
  await usuario.type(screen.getByLabelText("Início"), "2026-10-15T14:00");
  await usuario.type(screen.getByLabelText("Fim"), "2026-10-15T17:00");
  await usuario.selectOptions(screen.getByLabelText("Estilo (opcional)"), "estilo-1");
  await usuario.type(screen.getByLabelText("Região do corpo (opcional)"), "Antebraço");
  await usuario.type(screen.getByLabelText("Observações (opcional)"), "Referências no WhatsApp");
  await usuario.click(screen.getByRole("button", { name: "Salvar horário" }));

  await waitFor(() =>
    expect(enviar).toHaveBeenCalledWith({
      nomeContato: "Lucas Silveira",
      telefoneContato: "11987654321",
      emailCliente: "lucas@x.test",
      inicio: "2026-10-15T14:00",
      fim: "2026-10-15T17:00",
      estiloId: "estilo-1",
      tamanhoId: "",
      regiaoCorpo: "Antebraço",
      observacoes: "Referências no WhatsApp",
    }),
  );
  expect(aoSalvar).toHaveBeenCalledOnce();
});

it("RN10 o admin escolhe o artista; na edição, o formulário vem preenchido e manda o id", async () => {
  const usuario = userEvent.setup();
  const { enviar } = montar({
    artistas: ARTISTAS,
    inicial: {
      id: "horario-1",
      artistaId: "bia",
      nomeContato: "Bruna",
      telefoneContato: "11912345678",
      emailCliente: null,
      inicio: "2026-10-15T18:00",
      fim: "2026-10-15T19:00",
      estiloId: null,
      tamanhoId: "tamanho-1",
      regiaoCorpo: null,
      observacoes: null,
    },
  });
  expect((screen.getByLabelText("Artista") as HTMLSelectElement).value).toBe("bia");
  expect((screen.getByLabelText("Início") as HTMLInputElement).value).toBe("2026-10-15T18:00");
  await usuario.clear(screen.getByLabelText("Fim"));
  await usuario.type(screen.getByLabelText("Fim"), "2026-10-15T20:00");
  await usuario.click(screen.getByRole("button", { name: "Salvar horário" }));
  await waitFor(() =>
    expect(enviar).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "horario-1",
        artistaId: "bia",
        nomeContato: "Bruna",
        fim: "2026-10-15T20:00",
        tamanhoId: "tamanho-1",
      }),
    ),
  );
});

it("RF22/RN08 mostra o erro no campo e a recusa de sobreposição, sem fechar o formulário", async () => {
  const usuario = userEvent.setup();
  const enviar = vi
    .fn()
    .mockResolvedValueOnce({
      ok: false,
      erro: "invalido",
      mensagem: "Confira os campos destacados.",
      campos: { fim: "O fim precisa ser depois do início." },
    })
    .mockResolvedValueOnce({
      ok: false,
      erro: "sobreposto",
      mensagem: "Este artista já tem um horário nesse intervalo.",
    });
  const { aoSalvar } = montar({ enviar });
  const salvar = screen.getByRole("button", { name: "Salvar horário" });

  await usuario.click(salvar);
  const fim = await screen.findByLabelText("Fim");
  await waitFor(() => expect(fim.getAttribute("aria-invalid")).toBe("true"));
  expect(screen.getByText("O fim precisa ser depois do início.")).toBeDefined();

  await usuario.click(salvar);
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Este artista já tem um horário nesse intervalo.",
  );
  expect(aoSalvar).not.toHaveBeenCalled();
});
