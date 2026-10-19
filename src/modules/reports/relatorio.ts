import { comoAdmin } from "../artists/index";
import { vendasDoPeriodo, type VendaDoPeriodo } from "../orders/index";
import { periodoDoRelatorio, type PeriodoRelatorio } from "./periodo";

// RF32 (PBI-48): relatório de vendas para o ADMIN. Só leitura, dentro do comoAdmin (sessão e
// papel relidos no banco).

export type ResumoVendas = {
  // Soma do total dos pedidos pagos no período, com o frete.
  faturamentoCentavos: number;
  pedidosPagos: number;
  // Faturamento ÷ pedidos pagos, arredondado ao centavo; null sem pedido pago.
  ticketMedioCentavos: number | null;
};

// Por obra e por artista, a soma é dos itens (preço × quantidade), sem o frete: não bate com o
// faturamento quando houve entrega.
export type ObraVendida = {
  obraId: string;
  titulo: string;
  artista: string;
  unidades: number;
  valorCentavos: number;
};

export type VendasDoArtista = {
  artistaId: string;
  nome: string;
  unidades: number;
  valorCentavos: number;
};

export type RelatorioVendas = ResumoVendas & {
  periodo: PeriodoRelatorio;
  // Mais unidades primeiro; no empate, maior valor.
  obras: ObraVendida[];
  // Maior valor primeiro.
  artistas: VendasDoArtista[];
};

export function resumirVendas(vendas: VendaDoPeriodo[]): ResumoVendas {
  const faturamentoCentavos = vendas.reduce((soma, venda) => soma + venda.totalCentavos, 0);
  return {
    faturamentoCentavos,
    pedidosPagos: vendas.length,
    ticketMedioCentavos: vendas.length > 0 ? Math.round(faturamentoCentavos / vendas.length) : null,
  };
}

function somarPor<T extends { unidades: number; valorCentavos: number }>(
  vendas: VendaDoPeriodo[],
  chave: (item: VendaDoPeriodo["itens"][number]) => string,
  novo: (item: VendaDoPeriodo["itens"][number]) => T,
): T[] {
  const somas = new Map<string, T>();
  for (const item of vendas.flatMap((venda) => venda.itens)) {
    const soma = somas.get(chave(item)) ?? novo(item);
    soma.unidades += item.quantidade;
    soma.valorCentavos += item.precoCentavos * item.quantidade;
    somas.set(chave(item), soma);
  }
  return [...somas.values()];
}

function obrasMaisVendidas(vendas: VendaDoPeriodo[]): ObraVendida[] {
  return somarPor(
    vendas,
    (item) => item.obraId,
    (item) => ({
      obraId: item.obraId,
      titulo: item.titulo,
      artista: item.artista,
      unidades: 0,
      valorCentavos: 0,
    }),
  ).sort(
    (a, b) =>
      b.unidades - a.unidades ||
      b.valorCentavos - a.valorCentavos ||
      a.titulo.localeCompare(b.titulo, "pt-BR"),
  );
}

function vendasPorArtista(vendas: VendaDoPeriodo[]): VendasDoArtista[] {
  return somarPor(
    vendas,
    (item) => item.artistaId,
    (item) => ({ artistaId: item.artistaId, nome: item.artista, unidades: 0, valorCentavos: 0 }),
  ).sort((a, b) => b.valorCentavos - a.valorCentavos || a.nome.localeCompare(b.nome, "pt-BR"));
}

export function lerRelatorioVendas(entrada: unknown, cabecalhos: Headers, agora = new Date()) {
  return comoAdmin(cabecalhos, async (tx): Promise<RelatorioVendas> => {
    const periodo = periodoDoRelatorio(entrada, agora);
    const vendas = await vendasDoPeriodo(tx, periodo);
    return {
      periodo,
      ...resumirVendas(vendas),
      obras: obrasMaisVendidas(vendas),
      artistas: vendasPorArtista(vendas),
    };
  });
}
