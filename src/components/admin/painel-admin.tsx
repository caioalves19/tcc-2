import { TITULO_SECAO } from "@/components/conta/partes-pedido";
import { buttonVariants } from "@/components/ui/button";
import { formatarPreco } from "@/modules/catalog/cliente";
import { FILTROS_PEDIDOS } from "@/modules/orders/cliente";
import type { Painel } from "@/modules/reports";
import { dataBr, diaDaSemana, hora, nomeDoMes } from "./datas";
import { hrefPedidos, ROTULO_FILTRO } from "./lista-pedidos-admin";

// Os filtros de /admin/pedidos, menos "Todos".
const FILTROS_DO_PAINEL = FILTROS_PEDIDOS.filter(
  (filtro): filtro is keyof Painel["pedidos"] => filtro !== "todos",
);

const CARD =
  "grid content-start gap-1 rounded-card border-2 border-neutro-grafite bg-[var(--kolo-superficie)] p-4 text-[var(--kolo-superficie-texto)]";
const CARD_LINK = `${CARD} h-full hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50`;

function Indicador({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className={CARD}>
      <dt className="text-nota">{rotulo}</dt>
      <dd className="font-display text-titulo-lg">{valor}</dd>
    </div>
  );
}

// RF32 (PBI-48): painel da página inicial do admin (lerPainel). Só leitura: cada bloco leva à
// tela onde a ação acontece.
export function PainelAdmin({ painel }: { painel: Painel }) {
  const { periodo, vendas } = painel;
  return (
    <>
      <h1 className="font-display text-2xl">Painel</h1>

      <section aria-labelledby="painel-vendas" className="mt-8 grid gap-4">
        <div className="grid gap-1">
          <h2 id="painel-vendas" className={TITULO_SECAO}>
            Vendas de {nomeDoMes(periodo.de)}
          </h2>
          <p className="text-nota">
            De {dataBr(periodo.de)} a {dataBr(periodo.ate)}, pela data do pagamento.
          </p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-3">
          <Indicador rotulo="Faturamento" valor={formatarPreco(vendas.faturamentoCentavos)} />
          <Indicador rotulo="Pedidos pagos" valor={String(vendas.pedidosPagos)} />
          <Indicador
            rotulo="Ticket médio"
            valor={
              vendas.ticketMedioCentavos === null ? "—" : formatarPreco(vendas.ticketMedioCentavos)
            }
          />
        </dl>
        <a
          href="/admin/relatorio"
          className={buttonVariants({ variant: "contorno", className: "justify-self-start" })}
        >
          Ver relatório de vendas
        </a>
      </section>

      <section aria-labelledby="painel-pedidos" className="mt-10 grid gap-4">
        <h2 id="painel-pedidos" className={TITULO_SECAO}>
          Pedidos agora
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FILTROS_DO_PAINEL.map((filtro) => (
            <li key={filtro}>
              <a href={hrefPedidos(filtro, "")} className={CARD_LINK}>
                <span className="text-nota">{ROTULO_FILTRO[filtro]}</span>{" "}
                <span className="font-display text-titulo-lg">{painel.pedidos[filtro]}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="painel-obras" className="mt-10 grid gap-4">
        <h2 id="painel-obras" className={TITULO_SECAO}>
          Obras
        </h2>
        <dl className="grid gap-3 sm:grid-cols-3">
          <Indicador rotulo="Disponíveis" valor={String(painel.obras.DISPONIVEL)} />
          <Indicador rotulo="Esgotadas" valor={String(painel.obras.ESGOTADA)} />
          <Indicador rotulo="Rascunhos" valor={String(painel.obras.RASCUNHO)} />
        </dl>
        <a
          href="/admin/obras"
          className={buttonVariants({ variant: "contorno", className: "justify-self-start" })}
        >
          Gerenciar obras
        </a>
      </section>

      <section aria-labelledby="painel-agenda" className="mt-10 grid gap-4">
        <h2 id="painel-agenda" className={TITULO_SECAO}>
          Próximos 7 dias
        </h2>
        {painel.horarios.length === 0 ? (
          <p>Nenhum horário agendado nos próximos 7 dias.</p>
        ) : (
          <ul aria-label="Horários agendados" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {painel.horarios.map((horario) => (
              <li key={horario.codigo} className={CARD}>
                <p className="font-display">
                  {diaDaSemana(horario.inicio)} · {hora(horario.inicio)} às {hora(horario.fim)}
                </p>
                <p className="break-words">{horario.contato}</p>
                <p className="text-nota">Artista: {horario.artista}</p>
              </li>
            ))}
          </ul>
        )}
        <a
          href="/agenda"
          className={buttonVariants({ variant: "contorno", className: "justify-self-start" })}
        >
          Abrir agenda
        </a>
      </section>
    </>
  );
}
