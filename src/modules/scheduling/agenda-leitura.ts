import { z } from "zod";
import { obterPrisma } from "../../lib/prisma";
import { equipeDaRequisicao, executar } from "./agenda";
import { deSaoPauloParaUtc, inicioDaSemana, paraHorarioSaoPaulo, somarDias } from "./agenda-regras";

type Situacao = "AGENDADO" | "CANCELADO" | "CONCLUIDO";

export type HorarioAgenda = {
  id: string;
  codigo: string;
  artistaId: string;
  artistaNome: string;
  nomeContato: string;
  telefoneContato: string;
  emailCliente: string | null;
  // "AAAA-MM-DDTHH:MM" em São Paulo (RN09), pronto para o datetime-local da edição.
  inicio: string;
  fim: string;
  situacao: Situacao;
  estiloId: string | null;
  estiloNome: string | null;
  tamanhoId: string | null;
  tamanhoNome: string | null;
  regiaoCorpo: string | null;
  observacoes: string | null;
};

export type Opcao = { id: string; nome: string };

export type AgendaDaSemana = {
  papel: "ADMIN" | "ARTISTA";
  // Agenda exibida: a do próprio artista, ou o filtro do admin (null = todos).
  artistaId: string | null;
  // Só para o admin, que escolhe o artista; o artista recebe [].
  artistas: Opcao[];
  semana: { inicio: string; fim: string; anterior: string; proxima: string };
  // Segunda a domingo, sempre os 7 dias, com os horários em ordem.
  dias: { data: string; horarios: HorarioAgenda[] }[];
  opcoes: { estilos: Opcao[]; tamanhos: Opcao[] };
};

// RF22/RN09/RN10: a semana (segunda a domingo em São Paulo) da agenda. O artista vê só a dele,
// mesmo pedindo outra; o admin vê todas ou filtra por artista. Inclui cancelados e concluídos.
export function lerAgenda(cabecalhos: Headers, filtro: { semana?: unknown; artista?: unknown }) {
  return executar(async (): Promise<AgendaDaSemana> => {
    const equipe = await equipeDaRequisicao(cabecalhos);
    const prisma = obterPrisma();

    let inicio = inicioDaSemana(typeof filtro.semana === "string" ? filtro.semana : undefined);
    if (!deSaoPauloParaUtc(`${inicio}T00:00`)) inicio = inicioDaSemana(undefined);
    const proxima = somarDias(inicio, 7);
    const de = deSaoPauloParaUtc(`${inicio}T00:00`) ?? new Date();
    const ate = deSaoPauloParaUtc(`${proxima}T00:00`) ?? new Date();

    const artistas =
      equipe.papel === "ADMIN"
        ? (
            await prisma.artist.findMany({
              where: { user: { deletedAt: null } },
              include: { user: true },
              orderBy: { user: { name: "asc" } },
            })
          ).map((a) => ({ id: a.id, nome: a.user.name }))
        : [];
    const pedido = z.uuid().safeParse(filtro.artista);
    const artistaId =
      equipe.papel === "ARTISTA"
        ? equipe.artistaId
        : pedido.success && artistas.some((a) => a.id === pedido.data.toLowerCase())
          ? pedido.data.toLowerCase()
          : null;

    const [horarios, estilos, tamanhos] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          deletedAt: null,
          startsAt: { gte: de, lt: ate },
          ...(artistaId ? { artistId: artistaId } : {}),
        },
        include: {
          artist: { include: { user: true } },
          user: true,
          tattooStyle: true,
          sizeTier: true,
        },
        orderBy: [{ startsAt: "asc" }, { id: "asc" }],
      }),
      prisma.tattooStyle.findMany({ orderBy: { name: "asc" } }),
      prisma.sizeTier.findMany({ orderBy: { order: "asc" } }),
    ]);

    const dias = Array.from({ length: 7 }, (_, i) => ({
      data: somarDias(inicio, i),
      horarios: [] as HorarioAgenda[],
    }));
    for (const h of horarios) {
      const inicioLocal = paraHorarioSaoPaulo(h.startsAt);
      dias
        .find((d) => d.data === inicioLocal.slice(0, 10))
        ?.horarios.push({
          id: h.id,
          codigo: h.code,
          artistaId: h.artistId,
          artistaNome: h.artist.user.name,
          nomeContato: h.contactName,
          telefoneContato: h.contactPhone,
          emailCliente: h.user?.email ?? null,
          inicio: inicioLocal,
          fim: paraHorarioSaoPaulo(h.endsAt),
          situacao: h.status,
          estiloId: h.tattooStyleId,
          estiloNome: h.tattooStyle?.name ?? null,
          tamanhoId: h.sizeTierId,
          tamanhoNome: h.sizeTier?.name ?? null,
          regiaoCorpo: h.bodyRegion,
          observacoes: h.description,
        });
    }

    return {
      papel: equipe.papel,
      artistaId,
      artistas,
      semana: { inicio, fim: somarDias(inicio, 6), anterior: somarDias(inicio, -7), proxima },
      dias,
      opcoes: {
        estilos: estilos.map((e) => ({ id: e.id, nome: e.name })),
        tamanhos: tamanhos.map((t) => ({ id: t.id, nome: t.name })),
      },
    };
  });
}
