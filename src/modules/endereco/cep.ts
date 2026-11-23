import { z } from "zod";

import { UFS } from "./endereco";

// Preenchimento do endereço pelo CEP (RF05). O ViaCEP é público e não pede chave; a consulta sai
// do servidor (Server Action), então o navegador não fala com terceiros e a CSP não muda.
// Qualquer falha devolve null: o formulário continua manual, sem mensagem de erro.
export type EnderecoDoCep = {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
};

const TEMPO_LIMITE_MS = 3000;

const respostaViaCep = z.object({
  logradouro: z.string().trim().max(150).catch(""),
  bairro: z.string().trim().max(80).catch(""),
  localidade: z.string().trim().min(1).max(80),
  uf: z.enum(UFS),
});

export async function buscarEnderecoPorCep(
  cep: string,
  buscar: typeof fetch = fetch,
): Promise<EnderecoDoCep | null> {
  const digitos = cep.trim().replace("-", "");
  if (!/^\d{8}$/.test(digitos)) return null;
  try {
    const resposta = await buscar(`https://viacep.com.br/ws/${digitos}/json/`, {
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
      cache: "no-store",
    });
    if (!resposta.ok) return null;
    const lido = respostaViaCep.safeParse(await resposta.json());
    if (!lido.success) return null;
    const { logradouro, bairro, localidade, uf } = lido.data;
    return { logradouro, bairro, cidade: localidade, uf };
  } catch {
    return null;
  }
}
