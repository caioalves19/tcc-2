import { comoAdmin } from "../artists/index";
import { contarObrasPorSituacao, type ObrasPorSituacao } from "../catalog/index";
import { contarPedidosPorFiltro, vendasDoPeriodo, type ContagemPedidos } from "../orders/index";
import { proximosHorarios, type HorarioProximo } from "../scheduling/index";
import { periodoDoRelatorio, type PeriodoRelatorio } from "./periodo";
import { resumirVendas, type ResumoVendas } from "./relatorio";

// RF32 (PBI-48): painel da página inicial do admin. Só leitura, dentro do comoAdmin (sessão e
// papel relidos no banco).

export type Painel = {
  // Mês corrente em São Paulo, do dia 1 até hoje: o período padrão do relatório.
  periodo: PeriodoRelatorio;
  vendas: ResumoVendas;
  // Situação de agora: quantos pedidos cada filtro de /admin/pedidos mostra.
  pedidos: ContagemPedidos;
  obras: ObrasPorSituacao;
  // AGENDADO de agora até 7 dias depois, de todos os artistas, em ordem de início.
  horarios: HorarioProximo[];
};

export function lerPainel(cabecalhos: Headers, agora = new Date()) {
  return comoAdmin(cabecalhos, async (tx): Promise<Painel> => {
    const periodo = periodoDoRelatorio({}, agora);
    return {
      periodo,
      vendas: resumirVendas(await vendasDoPeriodo(tx, periodo)),
      pedidos: await contarPedidosPorFiltro(tx),
      obras: await contarObrasPorSituacao(tx),
      horarios: await proximosHorarios(tx, agora),
    };
  });
}
