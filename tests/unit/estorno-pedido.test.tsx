// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { EstornoPedido } from "../../src/components/admin/estorno-pedido";
import type { PedidoAdmin } from "../../src/modules/orders";

const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
  unstable_rethrow: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

type Pagamento = PedidoAdmin["pagamentos"][number];
const pagamento = (troca: Partial<Pagamento>): Pagamento => ({
  provedor: "mercado_pago",
  idExterno: "mp-1",
  metodo: "CARTAO",
  situacao: "APROVADO",
  valorCentavos: 960000,
  motivoEstorno: null,
  acaoEstorno: null,
  ...troca,
});

const acoes = () => ({
  cancelarPedido: vi.fn().mockResolvedValue({ ok: true, dados: { situacao: "CANCELADO" } }),
  estornarPagamento: vi.fn().mockResolvedValue({ ok: true, dados: { situacao: "ESTORNADO" } }),
});

it("PBI-43 cancela o pedido não pago só depois de confirmar", async () => {
  const usuario = userEvent.setup();
  const minhas = acoes();
  render(<EstornoPedido numero="20261012-ABC234" cancelavel pagamentos={[]} acoes={minhas} />);

  await usuario.click(screen.getByRole("button", { name: "Cancelar pedido" }));
  expect(screen.getByText(/não pode ser desfeito/)).toBeDefined();
  await usuario.click(screen.getByRole("button", { name: "Voltar" }));
  expect(minhas.cancelarPedido).not.toHaveBeenCalled();

  await usuario.click(screen.getByRole("button", { name: "Cancelar pedido" }));
  await usuario.click(screen.getByRole("button", { name: "Confirmar cancelamento" }));
  expect(minhas.cancelarPedido).toHaveBeenCalledWith({ numero: "20261012-ABC234" });
  expect(refresh).toHaveBeenCalled();
  expect(screen.getByRole("status").textContent).toBe("Pedido cancelado.");
});

it("PBI-43 estorna o pagamento marcado pelo webhook, com o motivo e confirmação", async () => {
  const usuario = userEvent.setup();
  const minhas = acoes();
  render(
    <EstornoPedido
      numero="20261012-ABC234"
      cancelavel={false}
      pagamentos={[
        pagamento({ idExterno: "mp-1", situacao: "RECUSADO" }),
        pagamento({
          idExterno: "mp-2",
          motivoEstorno: "PEDIDO_NAO_PENDENTE",
          acaoEstorno: "estornar",
        }),
      ]}
      acoes={minhas}
    />,
  );
  expect(screen.queryByRole("button", { name: "Cancelar pedido" })).toBeNull();
  expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual([
    "Estornar pagamento mp-2",
  ]);
  expect(screen.getByText(/pagamento chegou para um pedido que não aguardava/)).toBeDefined();

  await usuario.click(screen.getByRole("button", { name: "Estornar pagamento mp-2" }));
  expect(screen.getByText(/R\$ 9\.600,00 volta ao cliente/)).toBeDefined();
  await usuario.click(screen.getByRole("button", { name: "Confirmar estorno" }));

  expect(minhas.estornarPagamento).toHaveBeenCalledWith({
    numero: "20261012-ABC234",
    idExterno: "mp-2",
  });
  expect(screen.getByRole("status").textContent).toBe("Pagamento estornado.");
});

it("PBI-43 estorno feito no Mercado Pago só precisa ser concluído; erro do servidor aparece", async () => {
  const usuario = userEvent.setup();
  const minhas = acoes();
  minhas.estornarPagamento.mockResolvedValue({
    ok: false,
    erro: "falha",
    mensagem: "Não foi possível estornar agora. Tente de novo em instantes.",
  });
  render(
    <EstornoPedido
      numero="20261012-ABC234"
      cancelavel={false}
      pagamentos={[pagamento({ situacao: "ESTORNADO", acaoEstorno: "concluir" })]}
      acoes={minhas}
    />,
  );

  await usuario.click(screen.getByRole("button", { name: "Concluir estorno mp-1" }));
  await usuario.click(screen.getByRole("button", { name: "Confirmar estorno" }));

  expect(minhas.estornarPagamento).toHaveBeenCalledWith({
    numero: "20261012-ABC234",
    idExterno: "mp-1",
  });
  expect(screen.getByRole("alert").textContent).toBe(
    "Não foi possível estornar agora. Tente de novo em instantes.",
  );
  expect(refresh).not.toHaveBeenCalled();
});

it("PBI-43 sem nada a cancelar nem estornar, a seção não aparece", () => {
  const { container } = render(
    <EstornoPedido
      numero="20261012-ABC234"
      cancelavel={false}
      pagamentos={[pagamento({})]}
      acoes={acoes()}
    />,
  );
  expect(container.innerHTML).toBe("");
});

it("PBI-43 depois da última ação, a mensagem de sucesso continua na tela", async () => {
  const usuario = userEvent.setup();
  const minhas = acoes();
  const props = { numero: "20261012-ABC234", acoes: minhas };
  const { rerender } = render(
    <EstornoPedido
      {...props}
      cancelavel={false}
      pagamentos={[pagamento({ idExterno: "mp-1", acaoEstorno: "estornar" })]}
    />,
  );

  await usuario.click(screen.getByRole("button", { name: "Estornar pagamento mp-1" }));
  await usuario.click(screen.getByRole("button", { name: "Confirmar estorno" }));
  // O router.refresh() traz o pedido sem nenhuma ação pendente.
  rerender(
    <EstornoPedido
      {...props}
      cancelavel={false}
      pagamentos={[pagamento({ idExterno: "mp-1", situacao: "ESTORNADO" })]}
    />,
  );

  expect(screen.getByRole("status").textContent).toBe("Pagamento estornado.");
  expect(screen.queryAllByRole("button")).toEqual([]);
});
