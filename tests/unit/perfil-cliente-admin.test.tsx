// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { PerfilClienteAdmin } from "../../src/components/admin/perfil-cliente-admin";
import type { ClienteAdmin } from "../../src/modules/customers";

afterEach(cleanup);

const CLIENTE: ClienteAdmin = {
  id: "0b6f1d3a-1c1e-4c33-9a43-1f1c8f6f0a01",
  nome: "Lucas Silveira",
  email: "lucas@pbi38.test",
  telefone: "11987654321",
  situacao: "ATIVO",
  cadastradoEm: new Date("2026-09-20T15:00:00Z"),
  excluido: false,
  endereco: {
    destinatario: "Lucas Silveira",
    cep: "01327-000",
    logradouro: "Rua Treze de Maio",
    numero: "450",
    complemento: "Apto 82",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    uf: "SP",
  },
  pedidos: [
    {
      numero: "20261003-LUCAS2",
      criadoEm: new Date("2026-10-03T15:00:00Z"),
      situacao: "NAO_CONCLUIDO",
      situacaoBanco: "PENDENTE",
      modalidade: "RETIRADA",
      totalCentavos: 9990,
      unidades: 1,
    },
    {
      numero: "20261001-LUCAS1",
      criadoEm: new Date("2026-10-01T15:00:00Z"),
      situacao: "ENTREGUE",
      situacaoBanco: "ENTREGUE",
      modalidade: "RETIRADA",
      totalCentavos: 960000,
      unidades: 2,
    },
  ],
  totalGastoCentavos: 960000,
};

it("RF30 mostra os dados, o endereço e volta para a lista de clientes", () => {
  render(<PerfilClienteAdmin cliente={CLIENTE} />);
  expect(screen.getByRole("link", { name: "Clientes" }).getAttribute("href")).toBe(
    "/admin/clientes",
  );
  expect(screen.getByRole("heading", { level: 1, name: "Lucas Silveira" })).toBeDefined();
  expect(screen.queryByText("Conta excluída")).toBeNull();

  const dados = within(screen.getByRole("region", { name: "Dados" }));
  expect(dados.getByRole("link", { name: "lucas@pbi38.test" }).getAttribute("href")).toBe(
    "mailto:lucas@pbi38.test",
  );
  expect(dados.getByText("11987654321")).toBeDefined();
  expect(dados.getByText("Cliente desde 20/09/2026")).toBeDefined();
  expect(dados.getByText("Conta ativa")).toBeDefined();

  const endereco = screen.getByRole("region", { name: "Endereço de entrega" });
  expect(endereco.textContent).toContain("Rua Treze de Maio, 450 — Apto 82");
  expect(endereco.textContent).toContain("Bela Vista, São Paulo / SP · CEP 01327-000");
});

it("RF30 lista as compras com o total gasto e link para cada pedido", () => {
  render(<PerfilClienteAdmin cliente={CLIENTE} />);
  const compras = within(screen.getByRole("region", { name: "Compras" }));
  expect(compras.getByText("Total gasto: R$ 9.600,00")).toBeDefined();
  expect(compras.getByText("2 pedidos")).toBeDefined();

  const itens = within(compras.getByRole("list", { name: "Pedidos do cliente" })).getAllByRole(
    "listitem",
  );
  expect(itens).toHaveLength(2);
  const tentativa = within(itens[0]!);
  expect(tentativa.getByRole("link", { name: "Pedido 20261003-LUCAS2" }).getAttribute("href")).toBe(
    "/admin/pedidos/20261003-LUCAS2",
  );
  expect(tentativa.getByText("Não concluído")).toBeDefined();
  expect(itens[0]!.textContent).toContain("03/10/2026");
  expect(itens[0]!.textContent).toContain("R$ 99,90");
  expect(within(itens[1]!).getByText("Retirado")).toBeDefined();
});

it("RF30 cliente sem compras, sem endereço e com a conta excluída", () => {
  render(
    <PerfilClienteAdmin
      cliente={{
        ...CLIENTE,
        telefone: null,
        situacao: "INATIVO",
        excluido: true,
        endereco: null,
        pedidos: [],
        totalGastoCentavos: 0,
      }}
    />,
  );
  expect(screen.getByText("Conta excluída")).toBeDefined();
  const dados = within(screen.getByRole("region", { name: "Dados" }));
  expect(dados.getByText("Sem telefone")).toBeDefined();
  expect(dados.getByText("Conta inativa")).toBeDefined();
  expect(
    within(screen.getByRole("region", { name: "Endereço de entrega" })).getByText(
      "Nenhum endereço cadastrado.",
    ),
  ).toBeDefined();
  const compras = within(screen.getByRole("region", { name: "Compras" }));
  expect(compras.getByText("Total gasto: R$ 0,00")).toBeDefined();
  expect(compras.getByText("Nenhuma compra.")).toBeDefined();
  expect(compras.queryByRole("list")).toBeNull();
});
