import { z } from "zod";
import type { OpcoesWizard, ResultadoWizard } from "./tipos";

const schemaWizard = z
  .object({
    nome: z.string().trim().min(2, "Informe seu nome (mínimo de 2 caracteres).").max(100),
    artistaId: z.uuid("Selecione um artista."),
    estiloId: z.uuid("Selecione um estilo."),
    regiao: z.string().trim().min(2, "Informe a região do corpo.").max(80),
    tamanhoId: z.uuid("Selecione um tamanho."),
    data: z.iso.date("Informe uma data válida."),
    horario: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido."),
  })
  .strict();
export type DadosWizard = z.infer<typeof schemaWizard>;
export type PreferenciaWizard = DadosWizard & { preferenciaEm: string };

export function validarDadosWizard(
  entrada: unknown,
  opcoes: OpcoesWizard,
  agora = new Date(),
): ResultadoWizard<PreferenciaWizard> {
  const resultado = schemaWizard.safeParse(entrada);
  if (!resultado.success)
    return {
      ok: false,
      mensagem: resultado.error.issues[0]?.message ?? "Revise os dados informados.",
    };
  const dados = resultado.data;
  const artista = opcoes.artistas.find(({ id }) => id === dados.artistaId);
  if (!artista)
    return { ok: false, mensagem: "Artista indisponível. Atualize a página e escolha novamente." };
  if (!artista.estilos.some(({ id }) => id === dados.estiloId))
    return {
      ok: false,
      mensagem: "O estilo não está disponível para este artista. Atualize a página.",
    };
  if (!opcoes.tamanhos.some(({ id }) => id === dados.tamanhoId))
    return { ok: false, mensagem: "Tamanho indisponível. Atualize a página e escolha novamente." };
  // Preferência local de America/Sao_Paulo (UTC-03), sem consulta nem reserva de agenda.
  const preferencia = new Date(`${dados.data}T${dados.horario}:00-03:00`);
  if (!Number.isFinite(preferencia.getTime()) || preferencia <= agora)
    return { ok: false, mensagem: "Escolha uma preferência de data e horário no futuro." };
  return { ok: true, dados: { ...dados, preferenciaEm: preferencia.toISOString() } };
}
