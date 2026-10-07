import { describe, expect, it } from "vitest";

import { validarEndereco, type EntradaEndereco } from "../../src/modules/endereco";

const valido: EntradaEndereco = {
  destinatario: "Maria Souza",
  cep: "01310-100",
  logradouro: "Avenida Paulista",
  numero: "1000",
  complemento: "Apto 12",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "SP",
};

function camposComErro(entrada: unknown): Record<string, string> {
  const resultado = validarEndereco(entrada as EntradaEndereco);
  if (resultado.ok) throw new Error("Era esperado erro de validação");
  return resultado.campos as Record<string, string>;
}

describe("validarEndereco", () => {
  it("aceita um endereço completo", () => {
    const resultado = validarEndereco(valido);
    expect(resultado).toEqual({ ok: true, dados: valido });
  });

  it("normaliza CEP sem hífen, UF minúscula, espaços e complemento vazio", () => {
    const resultado = validarEndereco({
      ...valido,
      cep: "01310100",
      uf: " sp ",
      destinatario: "  Maria Souza  ",
      complemento: "   ",
    });
    expect(resultado).toEqual({
      ok: true,
      dados: { ...valido, complemento: null },
    });
  });

  it("aceita complemento ausente", () => {
    const semComplemento: Partial<EntradaEndereco> = { ...valido };
    delete semComplemento.complemento;
    const resultado = validarEndereco(semComplemento as EntradaEndereco);
    expect(resultado.ok).toBe(true);
  });

  it("exige todos os campos obrigatórios", () => {
    const campos = camposComErro({
      ...valido,
      destinatario: "",
      logradouro: " ",
      numero: "",
      bairro: "",
      cidade: "",
    });
    expect(Object.keys(campos).sort()).toEqual([
      "bairro",
      "cidade",
      "destinatario",
      "logradouro",
      "numero",
    ]);
  });

  it.each(["1310-100", "0131010", "013101000", "abcde-fgh", "01310_100", ""])(
    "rejeita o CEP %j",
    (cep) => {
      expect(camposComErro({ ...valido, cep }).cep).toMatch(/CEP/);
    },
  );

  it.each(["XX", "S", "SPP", "", "12"])("rejeita a UF %j", (uf) => {
    expect(camposComErro({ ...valido, uf }).uf).toMatch(/UF/);
  });

  it("limita o tamanho dos campos", () => {
    const campos = camposComErro({
      ...valido,
      destinatario: "a".repeat(121),
      numero: "1".repeat(11),
      complemento: "c".repeat(81),
    });
    expect(Object.keys(campos).sort()).toEqual(["complemento", "destinatario", "numero"]);
  });

  it("descarta campos extras, como um userId enviado pelo navegador", () => {
    const resultado = validarEndereco({ ...valido, userId: "outro-usuario" } as EntradaEndereco);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.dados).not.toHaveProperty("userId");
  });

  it.each([null, undefined, "texto", 42, []])("rejeita entrada que não é objeto: %j", (entrada) => {
    expect(camposComErro(entrada)).toEqual({ destinatario: "Confira os dados do endereço." });
  });

  it("rejeita valores que não são texto sem lançar erro", () => {
    const campos = camposComErro({ ...valido, cep: 1310100, numero: 10, complemento: 5 });
    expect(Object.keys(campos).sort()).toEqual(["cep", "complemento", "numero"]);
  });
});
