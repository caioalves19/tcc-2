// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PedidoCheckout } from "../../src/components/loja/pedido-checkout";

// Como no Next: unstable_rethrow relança só os erros internos (aqui, o do redirect).
const REDIRECT = Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;push;x" });
vi.mock("next/navigation", () => ({
  unstable_rethrow: (erro: unknown) => {
    if (erro === REDIRECT) throw erro;
  },
}));

const AGORA = new Date("2026-10-08T15:00:00Z");
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(AGORA);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const pedido = (extra: Record<string, unknown> = {}) => ({
  numero: "20261008-ABC234",
  situacao: "PENDENTE" as const,
  modalidade: "RETIRADA" as const,
  criadoEm: AGORA,
  reservaExpiraEm: new Date(AGORA.getTime() + (9 * 60 + 30) * 1000),
  itens: [
    { obraId: "obra-1", titulo: "Metrópole em chamas", precoCentavos: 285000, quantidade: 1 },
  ],
  endereco: {
    destinatario: "Lucas Silveira",
    cep: "01327-000",
    logradouro: "Rua Treze de Maio",
    numero: "450",
    complemento: null,
    bairro: "Bela Vista",
    cidade: "São Paulo",
    uf: "SP" as const,
  },
  subtotalCentavos: 285000,
  freteCentavos: 0,
  totalCentavos: 285000,
  ...extra,
});

const recusou = () => vi.fn().mockResolvedValue({ ok: false, erro: "falha", mensagem: "x" });

it("RF12/RN03 pedido pendente mostra número, resumo e o tempo para pagar, 2 min antes do fim da reserva", () => {
  render(<PedidoCheckout pedido={pedido()} pagar={recusou()} />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("20261008-ABC234");
  expect(screen.getByText("Aguardando pagamento")).toBeDefined();
  const reserva = screen.getByRole("timer");
  // Reserva com 9:30 restantes: o checkout fecha 2 minutos antes (RN06, folga para o webhook).
  expect(reserva.textContent).toContain("07:30");
  act(() => vi.advanceTimersByTime(1000));
  expect(reserva.textContent).toContain("07:29");

  const resumo = screen.getByRole("complementary", { name: "Resumo do pedido" });
  expect(within(resumo).getByRole("listitem").textContent).toContain("Metrópole em chamas");
  expect(resumo.textContent).toContain("Retirada no ateliê");
  expect(resumo.textContent).toContain("R$ 2.850,00");
  expect(screen.getByText(/Rua Treze de Maio, 450/)).toBeDefined();
  expect(screen.getByRole("button", { name: "Pagar com Mercado Pago" })).toHaveProperty(
    "disabled",
    false,
  );
});

it("RF13 pagar envia o número do pedido e trava o botão enquanto o Mercado Pago responde", async () => {
  type Recusa = { ok: false; erro: string; mensagem: string };
  let responder: (valor: Recusa) => void = () => {};
  const pagar = vi.fn<(numero: string) => Promise<Recusa>>(
    () => new Promise((resolver) => (responder = resolver)),
  );
  render(<PedidoCheckout pedido={pedido()} pagar={pagar} />);

  fireEvent.click(screen.getByRole("button", { name: "Pagar com Mercado Pago" }));
  expect(pagar).toHaveBeenCalledWith("20261008-ABC234");
  expect(screen.getByRole("button", { name: "Abrindo o pagamento…" })).toHaveProperty(
    "disabled",
    true,
  );

  await act(async () =>
    responder({
      ok: false,
      erro: "falha",
      mensagem: "Não foi possível abrir o pagamento agora. Tente de novo em instantes.",
    }),
  );
  expect(screen.getByRole("alert").textContent).toContain("Não foi possível abrir o pagamento");
  expect(screen.getByRole("button", { name: "Pagar com Mercado Pago" })).toHaveProperty(
    "disabled",
    false,
  );
});

it("RF13 erro inesperado na chamada vira mensagem na tela e libera nova tentativa", async () => {
  const pagar = vi.fn<(numero: string) => Promise<never>>().mockRejectedValue(new Error("rede"));
  render(<PedidoCheckout pedido={pedido()} pagar={pagar} />);

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Pagar com Mercado Pago" }));
  });
  expect(screen.getByRole("alert").textContent).toContain("Não foi possível abrir o pagamento");
  expect(screen.getByRole("button", { name: "Pagar com Mercado Pago" })).toHaveProperty(
    "disabled",
    false,
  );
});

it("RF13 no redirecionamento para o Mercado Pago o botão segue travado até a página sair", async () => {
  const relancados: unknown[] = [];
  const guardar = (motivo: unknown) => relancados.push(motivo);
  process.on("unhandledRejection", guardar);
  const pagar = vi.fn<(numero: string) => Promise<never>>().mockRejectedValue(REDIRECT);
  render(<PedidoCheckout pedido={pedido()} pagar={pagar} />);

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Pagar com Mercado Pago" }));
  });
  await act(async () => {});
  process.off("unhandledRejection", guardar);
  expect(relancados).toEqual([REDIRECT]);
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("button", { name: "Abrindo o pagamento…" })).toHaveProperty(
    "disabled",
    true,
  );
});

it("RN03 com o prazo para pagar vencido, avisa e leva de volta ao carrinho", () => {
  render(
    <PedidoCheckout
      pedido={pedido({ reservaExpiraEm: new Date(AGORA.getTime() + 2 * 60 * 1000 + 2000) })}
      pagar={recusou()}
    />,
  );
  act(() => vi.advanceTimersByTime(3000));
  expect(screen.queryByRole("timer")).toBeNull();
  const aviso = screen.getByRole("status");
  expect(aviso.textContent).toContain("O prazo para pagar acabou");
  expect(within(aviso).getByRole("link", { name: "Voltar ao carrinho" }).getAttribute("href")).toBe(
    "/carrinho",
  );
  expect(screen.queryByRole("button", { name: "Pagar com Mercado Pago" })).toBeNull();
});

it("RF12 pedido cancelado não oferece reserva nem pagamento", () => {
  render(
    <PedidoCheckout
      pedido={pedido({ situacao: "CANCELADO", reservaExpiraEm: null })}
      pagar={recusou()}
    />,
  );
  expect(screen.getByText("Pedido cancelado")).toBeDefined();
  expect(screen.queryByRole("timer")).toBeNull();
  expect(screen.queryByRole("button", { name: "Pagar com Mercado Pago" })).toBeNull();
});

it("RN05 na volta do Mercado Pago a tela só avisa que a confirmação está a caminho", () => {
  render(<PedidoCheckout pedido={pedido()} pagar={recusou()} voltouDoPagamento />);
  expect(screen.getByText("Aguardando pagamento")).toBeDefined();
  const aviso = screen.getByRole("status");
  expect(aviso.textContent).toContain("Estamos confirmando seu pagamento");
  expect(aviso.textContent).toContain("Pix ou boleto");
});
