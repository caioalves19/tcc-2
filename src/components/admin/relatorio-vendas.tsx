import { TITULO_SECAO } from "@/components/conta/partes-pedido";
import { buttonVariants } from "@/components/ui/button";
import { formatarPreco } from "@/modules/catalog/cliente";
import type { RelatorioVendas as Relatorio } from "@/modules/reports";
import { BotaoImprimir } from "./botao-imprimir";
import { dataBr } from "./datas";
import { classeCampo } from "./formulario";

// Períodos prontos; o intervalo vem do formulário. O padrão (este mês) fica fora da URL.
const ATALHOS = [
  { tipo: "este-mes", rotulo: "Este mês", href: "/admin/relatorio" },
  { tipo: "30-dias", rotulo: "Últimos 30 dias", href: "/admin/relatorio?periodo=30-dias" },
] as const;

const CARD =
  "grid content-start gap-1 rounded-card border-2 border-neutro-grafite bg-[var(--kolo-superficie)] p-4 text-[var(--kolo-superficie-texto)]";
const TABELA = "w-full border-collapse text-left text-nota";
const CABECALHO = "border-b-2 border-neutro-grafite px-2 py-2 font-display";
const CELULA = "border-b border-neutro-linha px-2 py-2 align-top";
const NUMERO = "whitespace-nowrap text-right";
const SEM_VENDA = "Nenhuma venda no período.";

function Indicador({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className={CARD}>
      <dt className="text-nota">{rotulo}</dt>
      <dd className="font-display text-titulo-lg">{valor}</dd>
    </div>
  );
}

// RF32 (PBI-48): relatório de vendas do período (lerRelatorioVendas). Tudo chega calculado do
// servidor; a tela só formata.
export function RelatorioVendas({ relatorio }: { relatorio: Relatorio }) {
  const { periodo, obras, artistas } = relatorio;
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-display text-2xl">Relatório de vendas</h1>
        <BotaoImprimir />
      </div>
      <p className="mt-2 text-nota">
        De {dataBr(periodo.de)} a {dataBr(periodo.ate)}, pela data do pagamento.
      </p>
      {periodo.aviso && (
        <p role="alert" className="mt-2 text-destructive">
          {periodo.aviso}
        </p>
      )}

      {/* Na impressão (CSS de impressão), sai só o relatório: sem a escolha do período. */}
      <div className="mt-6 grid gap-4 print:hidden">
        <nav aria-label="Período do relatório">
          <ul className="flex flex-wrap gap-2">
            {ATALHOS.map((atalho) => (
              <li key={atalho.tipo}>
                <a
                  href={atalho.href}
                  aria-current={atalho.tipo === periodo.tipo ? "page" : undefined}
                  className={buttonVariants({
                    variant: atalho.tipo === periodo.tipo ? "default" : "contorno",
                    size: "sm",
                  })}
                >
                  {atalho.rotulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {/* RF32: GET, sem JavaScript; o servidor valida as datas (periodoDoRelatorio). */}
        <form
          aria-label="Intervalo"
          action="/admin/relatorio"
          className="flex max-w-xl flex-wrap items-end gap-3"
        >
          <input type="hidden" name="periodo" value="intervalo" />
          <div className="grid gap-2">
            <label htmlFor="relatorio-de" className="text-nota font-semibold">
              De
            </label>
            <input
              id="relatorio-de"
              name="de"
              type="date"
              required
              defaultValue={periodo.de}
              className={classeCampo}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="relatorio-ate" className="text-nota font-semibold">
              Até
            </label>
            <input
              id="relatorio-ate"
              name="ate"
              type="date"
              required
              defaultValue={periodo.ate}
              className={classeCampo}
            />
          </div>
          <button
            type="submit"
            className={buttonVariants({
              variant: periodo.tipo === "intervalo" ? "default" : "contorno",
            })}
          >
            Ver intervalo
          </button>
        </form>
      </div>

      <section aria-labelledby="relatorio-total" className="mt-8 grid gap-4">
        <h2 id="relatorio-total" className={TITULO_SECAO}>
          Total do período
        </h2>
        <dl className="grid gap-3 sm:grid-cols-3">
          <Indicador rotulo="Faturamento" valor={formatarPreco(relatorio.faturamentoCentavos)} />
          <Indicador rotulo="Pedidos pagos" valor={String(relatorio.pedidosPagos)} />
          <Indicador
            rotulo="Ticket médio"
            valor={
              relatorio.ticketMedioCentavos === null
                ? "—"
                : formatarPreco(relatorio.ticketMedioCentavos)
            }
          />
        </dl>
      </section>

      <section aria-labelledby="relatorio-obras" className="mt-10 grid gap-4">
        <h2 id="relatorio-obras" className={TITULO_SECAO}>
          Obras mais vendidas
        </h2>
        {obras.length === 0 ? (
          <p>{SEM_VENDA}</p>
        ) : (
          <table aria-labelledby="relatorio-obras" className={TABELA}>
            <thead>
              <tr>
                <th scope="col" className={CABECALHO}>
                  Obra e artista
                </th>
                <th scope="col" className={`${CABECALHO} ${NUMERO}`}>
                  Unidades
                </th>
                <th scope="col" className={`${CABECALHO} ${NUMERO}`}>
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {obras.map((obra) => (
                <tr key={obra.obraId}>
                  <th scope="row" className={`${CELULA} font-normal [overflow-wrap:anywhere]`}>
                    <span className="block font-semibold">{obra.titulo}</span>
                    <span className="sr-only">, </span>
                    <span className="block">{obra.artista}</span>
                  </th>
                  <td className={`${CELULA} ${NUMERO}`}>{obra.unidades}</td>
                  <td className={`${CELULA} ${NUMERO}`}>{formatarPreco(obra.valorCentavos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section aria-labelledby="relatorio-artistas" className="mt-10 grid gap-4">
        <h2 id="relatorio-artistas" className={TITULO_SECAO}>
          Faturamento por artista
        </h2>
        {artistas.length === 0 ? (
          <p>{SEM_VENDA}</p>
        ) : (
          <table aria-labelledby="relatorio-artistas" className={TABELA}>
            <thead>
              <tr>
                <th scope="col" className={CABECALHO}>
                  Artista
                </th>
                <th scope="col" className={`${CABECALHO} ${NUMERO}`}>
                  Unidades
                </th>
                <th scope="col" className={`${CABECALHO} ${NUMERO}`}>
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {artistas.map((artista) => (
                <tr key={artista.artistaId}>
                  <th scope="row" className={`${CELULA} font-semibold [overflow-wrap:anywhere]`}>
                    {artista.nome}
                  </th>
                  <td className={`${CELULA} ${NUMERO}`}>{artista.unidades}</td>
                  <td className={`${CELULA} ${NUMERO}`}>{formatarPreco(artista.valorCentavos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="mt-6 text-nota">
        O faturamento soma o total dos pedidos, com o frete. As tabelas somam só as obras (preço ×
        quantidade), sem o frete, por isso os totais podem não bater.
      </p>
    </>
  );
}
