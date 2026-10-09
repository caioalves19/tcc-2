import { randomBytes } from "node:crypto";
import { z } from "zod";
import { sessaoDaRequisicao } from "../../lib/auth";
import { obterPrisma } from "../../lib/prisma";
import { codigoDoHorario, deSaoPauloParaUtc } from "./agenda-regras";

// Agenda manual (PBI-34, RF22): o artista ou o admin cadastra o horário combinado no WhatsApp.
// Sem fila de pendentes e sem motor de horários livres.

type ErroSimples = "nao_autenticado" | "proibido" | "falha";
export type ResultadoAgenda<T> =
  | { ok: true; dados: T }
  | { ok: false; erro: ErroSimples; mensagem: string }
  | { ok: false; erro: "invalido"; mensagem: string; campos: Record<string, string> };

class ErroAgenda extends Error {
  constructor(
    public codigo: ErroSimples,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

class ErroValidacao extends Error {
  constructor(public campos: Record<string, string>) {
    super("Confira os campos destacados.");
  }
}

type Equipe = { papel: "ADMIN" } | { papel: "ARTISTA"; artistaId: string };

// RN10: o papel, a situação da conta e o vínculo com o artista são relidos no banco a cada pedido,
// como no autorizarUpload (PBI-17); a sessão só diz quem pede.
async function equipeDaRequisicao(cabecalhos: Headers): Promise<Equipe> {
  const sessao = await sessaoDaRequisicao(cabecalhos);
  if (!sessao) throw new ErroAgenda("nao_autenticado", "Entre na sua conta para ver a agenda.");
  const atual = await obterPrisma().session.findUnique({
    where: { token: sessao.token },
    include: { user: { include: { artist: true } } },
  });
  if (!atual || atual.expiresAt <= new Date())
    throw new ErroAgenda("nao_autenticado", "Sua sessão expirou. Entre novamente.");
  const { user } = atual;
  if (user.status === "ATIVO" && user.deletedAt === null) {
    if (user.role === "ADMIN") return { papel: "ADMIN" };
    if (user.role === "ARTISTA" && user.artist)
      return { papel: "ARTISTA", artistaId: user.artist.id };
  }
  throw new ErroAgenda("proibido", "A agenda é só da equipe do Kolô.");
}

const opcional = (maximo: number) =>
  z
    .string()
    .trim()
    .max(maximo)
    .optional()
    .transform((valor) => (valor ? valor : null));

const horarioSaoPaulo = z.string().transform((valor, contexto) => {
  const instante = deSaoPauloParaUtc(valor);
  if (!instante) {
    contexto.addIssue({ code: "custom", message: "Informe data e hora." });
    return z.NEVER;
  }
  return instante;
});

const schemaHorario = z.object({
  artistaId: z.uuid().optional(),
  nomeContato: z.string().trim().min(1, "Informe o nome do contato.").max(120),
  telefoneContato: z
    .string()
    .transform((valor) => valor.replace(/\D/g, ""))
    .pipe(z.string().regex(/^\d{10,11}$/, "Informe o telefone com DDD.")),
  inicio: horarioSaoPaulo,
  fim: horarioSaoPaulo,
  estiloId: z.uuid().optional(),
  tamanhoId: z.uuid().optional(),
  regiaoCorpo: opcional(80),
  observacoes: opcional(1000),
});

function validar(entrada: unknown) {
  const resultado = schemaHorario.safeParse(entrada);
  if (resultado.success) return resultado.data;
  const campos: Record<string, string> = {};
  for (const problema of resultado.error.issues) {
    const campo = typeof problema.path[0] === "string" ? problema.path[0] : "inicio";
    campos[campo] ??= problema.message;
  }
  throw new ErroValidacao(campos);
}

async function executar<T>(acao: () => Promise<T>): Promise<ResultadoAgenda<T>> {
  try {
    return { ok: true, dados: await acao() };
  } catch (erro) {
    if (erro instanceof ErroAgenda) return { ok: false, erro: erro.codigo, mensagem: erro.message };
    if (erro instanceof ErroValidacao)
      return { ok: false, erro: "invalido", mensagem: erro.message, campos: erro.campos };
    console.error("Falha na agenda", erro instanceof Error ? erro.name : "erro desconhecido");
    return {
      ok: false,
      erro: "falha",
      mensagem: "Não foi possível salvar agora. Tente novamente.",
    };
  }
}

// RF22/RN09: grava o horário em UTC, com o código AG- e situação AGENDADO.
export function cadastrarHorario(entrada: unknown, cabecalhos: Headers) {
  return executar(async () => {
    const equipe = await equipeDaRequisicao(cabecalhos);
    const dados = validar(entrada);
    const artistaId = equipe.papel === "ARTISTA" ? equipe.artistaId : (dados.artistaId ?? "");
    const codigo = codigoDoHorario(new Date(), randomBytes(6));
    const criado = await obterPrisma().appointment.create({
      data: {
        code: codigo,
        artistId: artistaId,
        contactName: dados.nomeContato,
        contactPhone: dados.telefoneContato,
        startsAt: dados.inicio,
        endsAt: dados.fim,
        tattooStyleId: dados.estiloId ?? null,
        sizeTierId: dados.tamanhoId ?? null,
        bodyRegion: dados.regiaoCorpo,
        description: dados.observacoes,
      },
    });
    return { id: criado.id, codigo };
  });
}
