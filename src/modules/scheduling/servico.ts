import { createHash } from "node:crypto";
import { obterPrisma } from "../../lib/prisma";
import { consumirTentativa } from "../../lib/rate-limit/index";
import { linkWhatsApp } from "../../lib/contato";
import { ipDaRequisicao } from "../../lib/requisicao";
import { listarArtistasParaWizard } from "../artists/index";
import { lerConfiguracao } from "../settings/index";
import type { OpcoesWizard, ResultadoWizard } from "./tipos";
import { validarDadosWizard, type PreferenciaWizard } from "./validacao";

async function consultarOpcoes(): Promise<OpcoesWizard> {
  const [artistas, tamanhos] = await Promise.all([
    listarArtistasParaWizard(),
    obterPrisma().sizeTier.findMany({
      select: { id: true, name: true },
      orderBy: [{ order: "asc" }, { id: "asc" }],
    }),
  ]);
  return { artistas, tamanhos: tamanhos.map(({ id, name }) => ({ id, nome: name })) };
}

async function limitar(cabecalhos: Headers) {
  const ip = createHash("sha256").update(ipDaRequisicao(cabecalhos)).digest("hex");
  return consumirTentativa(`wizard:${ip}`, { maximo: 60, janelaMs: 10 * 60 * 1000 });
}

export async function carregarOpcoesWizard(
  cabecalhos: Headers,
): Promise<ResultadoWizard<OpcoesWizard>> {
  try {
    if ((await limitar(cabecalhos)).bloqueado)
      return { ok: false, mensagem: "Muitas tentativas. Tente novamente em 10 minutos." };
    return { ok: true, dados: await consultarOpcoes() };
  } catch {
    return {
      ok: false,
      mensagem: "Não foi possível carregar as opções. Tente novamente mais tarde.",
    };
  }
}

// RN01: apenas valida e devolve os dados; nunca persiste uma solicitação.
export async function revisarPreferenciaWizard(
  entrada: unknown,
  cabecalhos: Headers,
): Promise<ResultadoWizard<PreferenciaWizard>> {
  try {
    if ((await limitar(cabecalhos)).bloqueado)
      return { ok: false, mensagem: "Muitas tentativas. Tente novamente em 10 minutos." };
    const validada = validarDadosWizard(entrada, await consultarOpcoes());
    if (!validada.ok) return validada;
    // RF21/RF31: o link vai para o WhatsApp das configurações do site (PBI-39).
    const { contato } = await lerConfiguracao();
    return {
      ok: true,
      dados: {
        ...validada.dados,
        linkWhatsApp: linkWhatsApp(validada.dados.mensagem, contato.whatsapp),
      },
    };
  } catch {
    return {
      ok: false,
      mensagem: "Não foi possível revisar sua preferência. Tente novamente mais tarde.",
    };
  }
}
