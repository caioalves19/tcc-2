import { z } from "zod";

import type { ResultadoValidacaoDe } from "../identity";

export const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

function texto(obrigatorio: string, maximo: number, rotulo: string) {
  return z
    .string({ error: obrigatorio })
    .trim()
    .min(1, obrigatorio)
    .max(maximo, `${rotulo} aceita até ${maximo} caracteres.`);
}

const MENSAGEM_CEP = "Informe um CEP válido, como 01310-100.";
const MENSAGEM_UF = "Informe a UF com 2 letras, como SP.";

export const schemaEndereco = z.object({
  destinatario: texto("Informe o nome de quem vai receber.", 120, "O nome do destinatário"),
  cep: z
    .string({ error: MENSAGEM_CEP })
    .trim()
    .regex(/^\d{5}-?\d{3}$/, MENSAGEM_CEP)
    .transform((valor) => {
      const digitos = valor.replace("-", "");
      return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
    }),
  logradouro: texto("Informe a rua ou avenida.", 150, "A rua"),
  numero: texto("Informe o número (ou S/N).", 10, "O número"),
  complemento: z
    .string({ error: "Complemento inválido." })
    .trim()
    .max(80, "O complemento aceita até 80 caracteres.")
    .nullish()
    .transform((valor) => (valor === undefined || valor === null || valor === "" ? null : valor)),
  bairro: texto("Informe o bairro.", 80, "O bairro"),
  cidade: texto("Informe a cidade.", 80, "A cidade"),
  uf: z
    .string({ error: MENSAGEM_UF })
    .trim()
    .transform((valor) => valor.toUpperCase())
    .pipe(z.enum(UFS, { error: MENSAGEM_UF })),
});

// O que o formulário envia: tudo texto, complemento vazio quando não há.
export type EntradaEndereco = {
  destinatario: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

// O que é gravado: CEP no formato 00000-000, UF maiúscula, complemento nulo quando vazio.
export type DadosEndereco = z.output<typeof schemaEndereco>;

export type CampoEndereco = keyof EntradaEndereco;

export type ResultadoEndereco =
  | { ok: true }
  | { ok: false; erro: "invalido"; campos: Record<string, string> }
  | { ok: false; erro: "nao_autenticado" };

export const ENDERECO_VAZIO: EntradaEndereco = {
  destinatario: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
};

// Vinda de uma Server Action, a entrada pode ter qualquer formato: por isso o parse é sobre unknown.
export function validarEndereco(entrada: EntradaEndereco): ResultadoValidacaoDe<DadosEndereco> {
  const resultado = schemaEndereco.safeParse(entrada);
  if (resultado.success) {
    return { ok: true, dados: resultado.data };
  }
  const campos: Record<string, string> = {};
  for (const problema of resultado.error.issues) {
    const primeiro = problema.path[0];
    const campo = typeof primeiro === "string" ? primeiro : "destinatario";
    const mensagem =
      problema.path.length === 0 ? "Confira os dados do endereço." : problema.message;
    campos[campo] ??= mensagem;
  }
  return { ok: false, campos };
}
