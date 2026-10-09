import { randomBytes } from "node:crypto";
import { z } from "zod";
import { Prisma } from "../../../generated/prisma/client";
import { sessaoDaRequisicao } from "../../lib/auth";
import { obterPrisma } from "../../lib/prisma";
import { codigoDoHorario, deSaoPauloParaUtc } from "./agenda-regras";

// Agenda manual (PBI-34, RF22): o artista ou o admin cadastra o horário combinado no WhatsApp.
// Sem fila de pendentes e sem motor de horários livres.

type ErroSimples =
  | "nao_autenticado"
  | "proibido"
  | "sobreposto"
  | "cliente_inexistente"
  | "nao_encontrado"
  | "finalizado"
  | "falha";
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

export type Equipe = { papel: "ADMIN" } | { papel: "ARTISTA"; artistaId: string };

// RN10: o papel, a situação da conta e o vínculo com o artista são relidos no banco a cada pedido,
// como no autorizarUpload (PBI-17); a sessão só diz quem pede.
export async function equipeDaRequisicao(cabecalhos: Headers): Promise<Equipe> {
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

// Do formulário, campo opcional vazio chega como "": é o mesmo que não informar.
const idOpcional = (mensagem: string) =>
  z.preprocess((valor) => (valor === "" ? undefined : valor), z.uuid(mensagem).optional());

const DOZE_HORAS_MS = 12 * 60 * 60 * 1000;

const schemaHorario = z
  .object({
    artistaId: idOpcional("Escolha um artista cadastrado."),
    nomeContato: z.string().trim().min(1, "Informe o nome do contato.").max(120),
    telefoneContato: z
      .string()
      .transform((valor) => valor.replace(/\D/g, ""))
      .pipe(z.string().regex(/^\d{10,11}$/, "Informe o telefone com DDD.")),
    emailCliente: z
      .string()
      .trim()
      .toLowerCase()
      .optional()
      .transform((valor) => valor || null)
      .pipe(z.email("Informe um e-mail válido.").nullable()),
    inicio: horarioSaoPaulo,
    fim: horarioSaoPaulo,
    estiloId: idOpcional("Escolha um estilo cadastrado."),
    tamanhoId: idOpcional("Escolha um tamanho cadastrado."),
    regiaoCorpo: opcional(80),
    observacoes: opcional(1000),
  })
  // RN09/RF22: o intervalo é [início, fim) e uma sessão dura no máximo 12 horas.
  .superRefine(({ inicio, fim }, contexto) => {
    if (fim <= inicio)
      contexto.addIssue({
        code: "custom",
        path: ["fim"],
        message: "O fim precisa ser depois do início.",
      });
    else if (fim.getTime() - inicio.getTime() > DOZE_HORAS_MS)
      contexto.addIssue({
        code: "custom",
        path: ["fim"],
        message: "A sessão pode ter no máximo 12 horas.",
      });
  });

type DadosHorario = z.output<typeof schemaHorario>;

// Estilo e tamanho precisam existir; o e-mail, se veio, liga o horário a uma conta ativa.
async function vinculos(dados: DadosHorario) {
  const prisma = obterPrisma();
  const campos: Record<string, string> = {};
  if (dados.estiloId && !(await prisma.tattooStyle.findUnique({ where: { id: dados.estiloId } })))
    campos.estiloId = "Escolha um estilo cadastrado.";
  if (dados.tamanhoId && !(await prisma.sizeTier.findUnique({ where: { id: dados.tamanhoId } })))
    campos.tamanhoId = "Escolha um tamanho cadastrado.";
  if (Object.keys(campos).length > 0) throw new ErroValidacao(campos);
  if (!dados.emailCliente) return { userId: null };
  const conta = await prisma.user.findFirst({
    where: { email: dados.emailCliente, status: "ATIVO", deletedAt: null },
  });
  if (!conta) throw new ErroAgenda("cliente_inexistente", "Nenhuma conta ativa com esse e-mail.");
  return { userId: conta.id };
}

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

// RN08: quem garante que um artista não tem dois horários no mesmo intervalo é o banco
// (EXCLUDE appointment_no_overlap, que ignora cancelados e excluídos). O adaptador do Prisma
// entrega o erro original do Postgres (23P01) em meta.driverAdapterError.cause.
function violouSobreposicao(erro: unknown): boolean {
  if (!(erro instanceof Prisma.PrismaClientKnownRequestError)) return false;
  const causa = (erro.meta?.driverAdapterError as { cause?: { code?: string; message?: string } })
    ?.cause;
  return causa?.code === "23P01" && (causa.message ?? "").includes("appointment_no_overlap");
}

export async function executar<T>(acao: () => Promise<T>): Promise<ResultadoAgenda<T>> {
  try {
    return { ok: true, dados: await acao() };
  } catch (erro) {
    if (erro instanceof ErroAgenda) return { ok: false, erro: erro.codigo, mensagem: erro.message };
    if (erro instanceof ErroValidacao)
      return { ok: false, erro: "invalido", mensagem: erro.message, campos: erro.campos };
    if (violouSobreposicao(erro))
      return {
        ok: false,
        erro: "sobreposto",
        mensagem: "Este artista já tem um horário nesse intervalo.",
      };
    console.error("Falha na agenda", erro instanceof Error ? erro.name : "erro desconhecido");
    return {
      ok: false,
      erro: "falha",
      mensagem: "Não foi possível salvar agora. Tente novamente.",
    };
  }
}

// RN10: o artista só opera a própria agenda (pedir a de outro é recusado, não redirecionado);
// o admin escolhe um artista cadastrado.
async function artistaDoHorario(equipe: Equipe, pedido: string | undefined): Promise<string> {
  if (equipe.papel === "ARTISTA") {
    if (pedido && pedido.toLowerCase() !== equipe.artistaId)
      throw new ErroAgenda("proibido", "Você só pode mexer na sua própria agenda.");
    return equipe.artistaId;
  }
  if (!pedido) throw new ErroValidacao({ artistaId: "Escolha o artista." });
  const artista = await obterPrisma().artist.findUnique({
    where: { id: pedido },
    include: { user: true },
  });
  if (!artista || artista.user.deletedAt !== null)
    throw new ErroValidacao({ artistaId: "Escolha um artista cadastrado." });
  return artista.id;
}

// RF22/RN09: grava o horário em UTC, com o código AG- e situação AGENDADO.
export function cadastrarHorario(entrada: unknown, cabecalhos: Headers) {
  return executar(async () => {
    const equipe = await equipeDaRequisicao(cabecalhos);
    const dados = validar(entrada);
    const artistaId = await artistaDoHorario(equipe, dados.artistaId);
    const { userId } = await vinculos(dados);
    const codigo = codigoDoHorario(new Date(), randomBytes(6));
    const criado = await obterPrisma().appointment.create({
      data: {
        code: codigo,
        artistId: artistaId,
        userId,
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

// RN10: o artista só enxerga os próprios horários; o de outro responde como inexistente, sem
// revelar que existe. Só AGENDADO muda: CANCELADO e CONCLUIDO são finais.
async function horarioDaEquipe(equipe: Equipe, id: unknown) {
  const valido = z.uuid().safeParse(id);
  const horario = valido.success
    ? await obterPrisma().appointment.findFirst({
        where: {
          id: valido.data,
          deletedAt: null,
          ...(equipe.papel === "ARTISTA" ? { artistId: equipe.artistaId } : {}),
        },
      })
    : null;
  if (!horario) throw new ErroAgenda("nao_encontrado", "Horário não encontrado.");
  if (horario.status !== "AGENDADO") throw finalizado();
  return horario;
}

function finalizado() {
  return new ErroAgenda("finalizado", "Este horário já foi cancelado ou concluído.");
}

// Atualiza só se o horário ainda está AGENDADO (e, para o artista, ainda é dele): uma edição e um
// cancelamento simultâneos não passam os dois.
async function atualizarSeAgendado(
  equipe: Equipe,
  id: string,
  dados: Prisma.AppointmentUncheckedUpdateManyInput,
) {
  const { count } = await obterPrisma().appointment.updateMany({
    where: {
      id,
      status: "AGENDADO",
      deletedAt: null,
      ...(equipe.papel === "ARTISTA" ? { artistId: equipe.artistaId } : {}),
    },
    data: dados,
  });
  if (count === 0) throw finalizado();
}

function campoDe(entrada: unknown, campo: string): unknown {
  return typeof entrada === "object" && entrada !== null
    ? (entrada as Record<string, unknown>)[campo]
    : undefined;
}

// RF22/RN08: editar passa pela mesma constraint de sobreposição; o código não muda.
export function editarHorario(entrada: unknown, cabecalhos: Headers) {
  return executar(async () => {
    const equipe = await equipeDaRequisicao(cabecalhos);
    const atual = await horarioDaEquipe(equipe, campoDe(entrada, "id"));
    const dados = validar(entrada);
    const artistaId =
      equipe.papel === "ADMIN" && !dados.artistaId
        ? atual.artistId
        : await artistaDoHorario(equipe, dados.artistaId);
    const { userId } = await vinculos(dados);
    await atualizarSeAgendado(equipe, atual.id, {
      artistId: artistaId,
      userId,
      contactName: dados.nomeContato,
      contactPhone: dados.telefoneContato,
      startsAt: dados.inicio,
      endsAt: dados.fim,
      tattooStyleId: dados.estiloId ?? null,
      sizeTierId: dados.tamanhoId ?? null,
      bodyRegion: dados.regiaoCorpo,
      description: dados.observacoes,
    });
  });
}

const schemaSituacao = z.enum(["CANCELADO", "CONCLUIDO"]);

// RF22: cancelar libera o intervalo (a constraint ignora cancelados); concluir registra a sessão.
export function mudarSituacaoHorario(entrada: unknown, cabecalhos: Headers) {
  return executar(async () => {
    const equipe = await equipeDaRequisicao(cabecalhos);
    const nova = schemaSituacao.safeParse(campoDe(entrada, "situacao"));
    if (!nova.success) throw new ErroValidacao({ situacao: "Escolha cancelar ou concluir." });
    const atual = await horarioDaEquipe(equipe, campoDe(entrada, "id"));
    await atualizarSeAgendado(equipe, atual.id, { status: nova.data });
  });
}
