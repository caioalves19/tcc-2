import { z } from "zod";
import { linkWhatsApp } from "../../lib/contato";
import type { OpcoesWizard, ResultadoWizard } from "./tipos";
import { mensagemAgendamento } from "./whatsapp";

// RF23–RF25: aceites dos avisos presenciais; validados aqui e nunca persistidos (RNF18).
const MENSAGEM_AVISOS = "Confirme os três avisos para continuar.";
const aceite = z.literal(true, { error: MENSAGEM_AVISOS });

const schemaWizard = z
  .object({
    nome: z.string().trim().min(2, "Informe seu nome (mínimo de 2 caracteres).").max(100),
    artistaId: z.uuid("Selecione um artista."),
    estiloId: z.uuid("Selecione um estilo."),
    regiao: z.string().trim().min(2, "Informe a região do corpo.").max(80),
    tamanhoId: z.uuid("Selecione um tamanho."),
    data: z.iso.date("Informe uma data válida."),
    horario: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido."),
    aceites: z.strictObject(
      { anamnese: aceite, termo: aceite, maioridade: aceite },
      { error: MENSAGEM_AVISOS },
    ),
  })
  .strict();
export type DadosWizard = z.infer<typeof schemaWizard>;
// RF21 (PBI-33): a revisão devolve também a mensagem e o link do WhatsApp do estúdio.
export type PreferenciaWizard = DadosWizard & {
  preferenciaEm: string;
  mensagem: string;
  linkWhatsApp: string;
};
// Estado do formulário: os aceites começam desmarcados; só `true` passa na validação.
export type EntradaWizard = Omit<DadosWizard, "aceites"> & {
  aceites: Record<keyof DadosWizard["aceites"], boolean>;
};

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
  const estilo = artista.estilos.find(({ id }) => id === dados.estiloId);
  if (!estilo)
    return {
      ok: false,
      mensagem: "O estilo não está disponível para este artista. Atualize a página.",
    };
  const tamanho = opcoes.tamanhos.find(({ id }) => id === dados.tamanhoId);
  if (!tamanho)
    return { ok: false, mensagem: "Tamanho indisponível. Atualize a página e escolha novamente." };
  // Preferência local de America/Sao_Paulo (UTC-03), sem consulta nem reserva de agenda.
  const preferencia = new Date(`${dados.data}T${dados.horario}:00-03:00`);
  if (!Number.isFinite(preferencia.getTime()) || preferencia <= agora)
    return { ok: false, mensagem: "Escolha uma preferência de data e horário no futuro." };
  const mensagem = mensagemAgendamento({
    ...dados,
    artista: artista.nome,
    estilo: estilo.nome,
    tamanho: tamanho.nome,
  });
  return {
    ok: true,
    dados: {
      ...dados,
      preferenciaEm: preferencia.toISOString(),
      mensagem,
      linkWhatsApp: linkWhatsApp(mensagem),
    },
  };
}
