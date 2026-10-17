// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PedidoAdminDetalhe } from "../../src/components/admin/pedido-admin";
import type { PedidoAdmin } from "../../src/modules/orders";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  unstable_rethrow: vi.fn(),
}));
afterEach(cleanup);

const PEDIDO: PedidoAdmin = {
  numero: "20261002-DETAL1",
  criadoEm: new Date("2026-10-02T15:00:00Z"),
  situacao: "ENVIADO",
  situacaoBanco: "ENVIADO",
  modalidade: "RETIRADA",
  cliente: {
    nome: "Maria Prado",
    email: "maria@pbi30.test",
    telefone: "11987654321",
    perfilId: "0b6f1d3a-1c1e-4c33-9a43-1f1c8f6f0a01",
  },
  itens: [{ titulo: "Metrópole em chamas", precoCentavos: 480000, quantidade: 2 }],
  subtotalCentavos: 960000,
  freteCentavos: 0,
  totalCentavos: 960000,
  endereco: {
    destinatario: "Maria Prado",
    cep: "01327000",
    logradouro: "Rua Treze de Maio",
    numero: "450",
    complemento: "",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    uf: "SP",
  },
  rastreio: "BR123456789SP",
  pagoEm: new Date("2026-10-02T15:05:00Z"),
  enviadoEm: new Date("2026-10-03T10:00:00Z"),
  cancelavel: false,
  pagamentos: [
    {
      provedor: "mercado_pago",
      idExterno: "mp-1",
      metodo: "PIX",
      situacao: "RECUSADO",
      valorCentavos: 960000,
      motivoEstorno: null,
      acaoEstorno: null,
    },
    {
      provedor: "mercado_pago",
      idExterno: "mp-2",
      metodo: "CARTAO",
      situacao: "APROVADO",
      valorCentavos: 960000,
      motivoEstorno: null,
      acaoEstorno: null,
    },
  ],
};

const acoes = {
  mudarSituacao: vi.fn(),
  registrarRastreio: vi.fn(),
  cancelarPedido: vi.fn(),
  estornarPagamento: vi.fn(),
};

it("RF29 mostra cliente, datas, pagamentos, entrega, resumo e as ações do pedido", () => {
  render(<PedidoAdminDetalhe pedido={PEDIDO} acoes={acoes} />);
  expect(screen.getByRole("link", { name: "Pedidos" }).getAttribute("href")).toBe("/admin/pedidos");
  expect(screen.getByRole("heading", { level: 1, name: "Pedido 20261002-DETAL1" })).toBeDefined();
  expect(screen.getByText("Pronto para retirada", { selector: "span" })).toBeDefined();
  const datas = screen.getByRole("list", { name: "Datas do pedido" }).textContent ?? "";
  expect(datas).toContain("Feito em 02/10/2026");
  expect(datas).toContain("Pago em 02/10/2026");
  expect(datas).toContain("Pronto para retirada em 03/10/2026");

  const cliente = screen.getByRole("region", { name: "Cliente" });
  // PBI-38: o nome leva ao perfil do cliente.
  expect(within(cliente).getByRole("link", { name: "Maria Prado" }).getAttribute("href")).toBe(
    "/admin/clientes/0b6f1d3a-1c1e-4c33-9a43-1f1c8f6f0a01",
  );
  expect(within(cliente).getByRole("link", { name: "maria@pbi30.test" }).getAttribute("href")).toBe(
    "mailto:maria@pbi30.test",
  );
  expect(cliente.textContent).toContain("11987654321");

  const pagamentos = within(screen.getByRole("region", { name: "Pagamentos" })).getAllByRole(
    "listitem",
  );
  expect(pagamentos.map((p) => p.textContent)).toEqual([
    "Pix · Recusado · R$ 9.600,00Mercado Pago · mp-1",
    "Cartão · Aprovado · R$ 9.600,00Mercado Pago · mp-2",
  ]);

  expect(screen.getByRole("region", { name: "Entrega" }).textContent).toContain(
    "Retirada no ateliê",
  );
  expect(screen.getByRole("region", { name: "Resumo do pedido" }).textContent).toContain(
    "R$ 9.600,00",
  );
  expect(screen.getByRole("button", { name: "Marcar como Retirado" })).toBeDefined();
  expect(screen.getByLabelText<HTMLInputElement>("Código de rastreio").value).toBe("BR123456789SP");
});

it("sem pagamento registrado e sem telefone, avisa", () => {
  render(
    <PedidoAdminDetalhe
      pedido={{
        ...PEDIDO,
        situacao: "NAO_CONCLUIDO",
        situacaoBanco: "PENDENTE",
        pagamentos: [],
        pagoEm: null,
        enviadoEm: null,
        rastreio: null,
        cliente: { ...PEDIDO.cliente, telefone: null, perfilId: null },
      }}
      acoes={acoes}
    />,
  );
  expect(screen.getByText("Nenhum pagamento registrado.")).toBeDefined();
  const cliente = screen.getByRole("region", { name: "Cliente" });
  expect(cliente.textContent).toContain("Sem telefone");
  // Quem comprou não é cliente (ADMIN ou ARTISTA): sem perfil para abrir.
  expect(cliente.textContent).toContain("Maria Prado");
  expect(within(cliente).queryByRole("link", { name: "Maria Prado" })).toBeNull();
  expect(screen.getByText("Não concluído", { selector: "span" })).toBeDefined();
  expect(screen.getByRole("list", { name: "Datas do pedido" }).textContent).not.toContain("Pago");
});

it("RF29 pagamento com saldo da conta Mercado Pago aparece com o meio certo", () => {
  const pagamento = {
    provedor: "mercado_pago",
    idExterno: "mp-3",
    metodo: "SALDO_MERCADO_PAGO",
    situacao: "APROVADO",
    valorCentavos: 960000,
    motivoEstorno: null,
    acaoEstorno: null,
  } as const;
  render(<PedidoAdminDetalhe pedido={{ ...PEDIDO, pagamentos: [pagamento] }} acoes={acoes} />);
  const pagamentos = within(screen.getByRole("region", { name: "Pagamentos" })).getAllByRole(
    "listitem",
  );
  expect(pagamentos.map((p) => p.textContent)).toEqual([
    "Saldo Mercado Pago · Aprovado · R$ 9.600,00Mercado Pago · mp-3",
  ]);
});

it("RN12 pedido de conta excluída mostra só cidade e UF, sem os campos apagados", () => {
  const anonimo = {
    ...PEDIDO,
    situacao: "ENTREGUE",
    situacaoBanco: "ENTREGUE",
    cliente: { ...PEDIDO.cliente, nome: "Cliente excluído", telefone: null },
    endereco: {
      destinatario: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "São Paulo",
      uf: "SP",
    },
  } satisfies PedidoAdmin;
  render(<PedidoAdminDetalhe pedido={anonimo} acoes={acoes} />);
  const entrega = screen.getByRole("heading", { level: 2, name: "Entrega" }).closest("section");
  const texto = entrega?.querySelector("address")?.textContent ?? "";
  expect(texto).toBe("Endereço apagado com a exclusão da contaSão Paulo / SP");
});
