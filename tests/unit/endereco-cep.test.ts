import { describe, expect, it, vi } from "vitest";
import { buscarEnderecoPorCep } from "@/modules/endereco";

function respostaJson(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Formato documentado em viacep.com.br (exemplo oficial: CEP 01001-000).
const PRACA_DA_SE = {
  cep: "01001-000",
  logradouro: "Praça da Sé",
  complemento: "lado ímpar",
  bairro: "Sé",
  localidade: "São Paulo",
  uf: "SP",
  ibge: "3550308",
};

describe("buscarEnderecoPorCep", () => {
  it("consulta o ViaCEP só com os dígitos e devolve rua, bairro, cidade e UF", async () => {
    const buscar = vi.fn().mockResolvedValue(respostaJson(PRACA_DA_SE));
    expect(await buscarEnderecoPorCep("01001-000", buscar)).toEqual({
      logradouro: "Praça da Sé",
      bairro: "Sé",
      cidade: "São Paulo",
      uf: "SP",
    });
    expect(buscar).toHaveBeenCalledWith(
      "https://viacep.com.br/ws/01001000/json/",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("CEP de cidade com CEP único volta sem rua e sem bairro", async () => {
    const buscar = vi.fn().mockResolvedValue(
      respostaJson({
        cep: "78175-000",
        logradouro: "",
        bairro: "",
        localidade: "Poconé",
        uf: "MT",
      }),
    );
    expect(await buscarEnderecoPorCep("78175000", buscar)).toEqual({
      logradouro: "",
      bairro: "",
      cidade: "Poconé",
      uf: "MT",
    });
  });

  it("CEP malformado nem consulta o ViaCEP", async () => {
    const buscar = vi.fn();
    expect(await buscarEnderecoPorCep("0100", buscar)).toBeNull();
    expect(await buscarEnderecoPorCep("01001-00a", buscar)).toBeNull();
    expect(buscar).not.toHaveBeenCalled();
  });

  it.each([
    ["CEP inexistente", () => Promise.resolve(respostaJson({ erro: true }))],
    ["ViaCEP com erro HTTP", () => Promise.resolve(respostaJson({}, 503))],
    ["resposta que não é JSON", () => Promise.resolve(new Response("<html>"))],
    ["UF fora da lista", () => Promise.resolve(respostaJson({ ...PRACA_DA_SE, uf: "XX" }))],
    ["rede fora do ar ou tempo esgotado", () => Promise.reject(new Error("timeout"))],
  ])("%s devolve null sem lançar erro", async (_caso, resposta) => {
    expect(await buscarEnderecoPorCep("01001-000", vi.fn(resposta))).toBeNull();
  });
});
