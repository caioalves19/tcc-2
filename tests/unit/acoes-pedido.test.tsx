// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { AcoesPedido } from "../../src/components/admin/acoes-pedido";

const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
  unstable_rethrow: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const acoes = () => ({
  mudarSituacao: vi.fn().mockResolvedValue({ ok: true, dados: { situacao: "ENVIADO" } }),
  registrarRastreio: vi.fn().mockResolvedValue({ ok: true, dados: { rastreio: "BR1234" } }),
});

it("RF29 oferece só as próximas situações e pede confirmação, porque não dá para voltar", async () => {
  const usuario = userEvent.setup();
  const minhas = acoes();
  render(
    <AcoesPedido
      numero="20261008-ABC234"
      situacao="PAGO"
      modalidade="RETIRADA"
      rastreio={null}
      acoes={minhas}
    />,
  );
  expect(screen.getAllByRole("button", { name: /^Marcar como/ }).map((b) => b.textContent)).toEqual(
    ["Marcar como Em preparação", "Marcar como Pronto para retirada", "Marcar como Retirado"],
  );

  await usuario.click(screen.getByRole("button", { name: "Marcar como Pronto para retirada" }));
  expect(screen.getByText(/não pode ser desfeita/)).toBeDefined();
  await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(minhas.mudarSituacao).not.toHaveBeenCalled();

  await usuario.click(screen.getByRole("button", { name: "Marcar como Pronto para retirada" }));
  await usuario.click(screen.getByRole("button", { name: "Confirmar" }));
  expect(minhas.mudarSituacao).toHaveBeenCalledWith({
    numero: "20261008-ABC234",
    de: "PAGO",
    para: "ENVIADO",
  });
  expect(refresh).toHaveBeenCalled();
  expect(screen.getByRole("status").textContent).toBe("Situação atualizada.");
});

it("RN05 pendente não tem botão: a situação muda quando o pagamento é aprovado", () => {
  render(
    <AcoesPedido
      numero="20261008-ABC234"
      situacao="PENDENTE"
      modalidade="RETIRADA"
      rastreio={null}
      acoes={acoes()}
    />,
  );
  expect(screen.queryByRole("button", { name: /^Marcar como/ })).toBeNull();
  expect(screen.getByText(/quando o pagamento for aprovado/)).toBeDefined();
  expect(screen.queryByLabelText("Código de rastreio")).toBeNull();
});

it("mostra o erro do servidor, como a situação desatualizada", async () => {
  const usuario = userEvent.setup();
  const minhas = acoes();
  minhas.mudarSituacao.mockResolvedValue({
    ok: false,
    erro: "conflito",
    mensagem: "A situação deste pedido mudou. Atualize a página.",
  });
  render(
    <AcoesPedido
      numero="20261008-ABC234"
      situacao="PROCESSANDO"
      modalidade="RETIRADA"
      rastreio={null}
      acoes={minhas}
    />,
  );
  await usuario.click(screen.getByRole("button", { name: "Marcar como Retirado" }));
  await usuario.click(screen.getByRole("button", { name: "Confirmar" }));
  expect(screen.getByRole("alert").textContent).toBe(
    "A situação deste pedido mudou. Atualize a página.",
  );
  expect(refresh).not.toHaveBeenCalled();
});

it("RF29 registra o rastreio a partir de pago, e vazio remove", async () => {
  const usuario = userEvent.setup();
  const minhas = acoes();
  render(
    <AcoesPedido
      numero="20261008-ABC234"
      situacao="ENVIADO"
      modalidade="RETIRADA"
      rastreio="BR0001"
      acoes={minhas}
    />,
  );
  const campo = screen.getByLabelText<HTMLInputElement>("Código de rastreio");
  expect(campo.value).toBe("BR0001");
  await usuario.clear(campo);
  await usuario.type(campo, "br1234");
  await usuario.click(screen.getByRole("button", { name: "Salvar rastreio" }));
  expect(minhas.registrarRastreio).toHaveBeenCalledWith({
    numero: "20261008-ABC234",
    codigo: "br1234",
  });
  expect(screen.getByRole("status").textContent).toBe("Rastreio salvo.");
});
