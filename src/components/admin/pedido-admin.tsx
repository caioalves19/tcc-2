import { ArrowLeft } from "lucide-react";

import { EntregaPedido, ResumoPedido, TITULO_SECAO } from "@/components/conta/partes-pedido";
import { dataDoPedido, EtiquetaSituacao } from "@/components/conta/situacao-pedido";
import { formatarPreco } from "@/modules/catalog/cliente";
import type { PedidoAdmin } from "@/modules/orders";
import { rotuloSituacao } from "@/modules/orders/cliente";
import { AcoesPedido } from "./acoes-pedido";

type Pagamento = PedidoAdmin["pagamentos"][number];

const METODO: Record<Pagamento["metodo"], string> = {
  PIX: "Pix",
  CARTAO: "Cartão",
  BOLETO: "Boleto",
};
const SITUACAO_PAGAMENTO: Record<Pagamento["situacao"], string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
  ESTORNADO: "Estornado",
};
const PROVEDOR: Record<string, string> = { mercado_pago: "Mercado Pago" };

const SECAO = "grid content-start gap-3";

// RF29: detalhe do pedido para o ADMIN (lerPedidoAdmin). Dados de pagamento sem o payload do
// gateway; as ações (situação e rastreio) ficam no componente de cliente AcoesPedido.
export function PedidoAdminDetalhe({
  pedido,
  acoes,
}: {
  pedido: PedidoAdmin;
  acoes: Parameters<typeof AcoesPedido>[0]["acoes"];
}) {
  const datas = [
    `Feito em ${dataDoPedido(pedido.criadoEm)}`,
    pedido.pagoEm && `Pago em ${dataDoPedido(pedido.pagoEm)}`,
    pedido.enviadoEm &&
      `${rotuloSituacao("ENVIADO", pedido.modalidade)} em ${dataDoPedido(pedido.enviadoEm)}`,
  ].filter(Boolean);
  return (
    <>
      <a
        href="/admin/pedidos"
        className="inline-flex items-center gap-1 text-[var(--kolo-link)] underline underline-offset-4"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Pedidos
      </a>
      <div className="mt-6">
        <EtiquetaSituacao situacao={pedido.situacao} modalidade={pedido.modalidade} />
      </div>
      <h1 className="mt-3 break-words font-display text-2xl">Pedido {pedido.numero}</h1>
      <ul aria-label="Datas do pedido" className="mt-2 flex flex-wrap gap-x-4 text-nota">
        {datas.map((data) => (
          <li key={data}>{data}</li>
        ))}
      </ul>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="grid content-start gap-8">
          <AcoesPedido
            numero={pedido.numero}
            situacao={pedido.situacaoBanco}
            modalidade={pedido.modalidade}
            rastreio={pedido.rastreio}
            acoes={acoes}
          />

          <section aria-labelledby="pedido-cliente" className={SECAO}>
            <h2 id="pedido-cliente" className={TITULO_SECAO}>
              Cliente
            </h2>
            <p>{pedido.cliente.nome}</p>
            <a
              href={`mailto:${pedido.cliente.email}`}
              className="break-all text-[var(--kolo-link)] underline underline-offset-4"
            >
              {pedido.cliente.email}
            </a>
            <p>{pedido.cliente.telefone ?? "Sem telefone"}</p>
          </section>

          <section aria-labelledby="pedido-pagamentos" className={SECAO}>
            <h2 id="pedido-pagamentos" className={TITULO_SECAO}>
              Pagamentos
            </h2>
            {pedido.pagamentos.length === 0 ? (
              <p>Nenhum pagamento registrado.</p>
            ) : (
              <ul className="grid gap-2">
                {pedido.pagamentos.map((pagamento, indice) => (
                  <li
                    key={pagamento.idExterno ?? indice}
                    className="grid gap-1 rounded-card border-2 border-neutro-grafite p-3"
                  >
                    <span className="font-semibold">
                      {METODO[pagamento.metodo]} · {SITUACAO_PAGAMENTO[pagamento.situacao]} ·{" "}
                      {formatarPreco(pagamento.valorCentavos)}
                    </span>
                    <span className="break-all text-nota">
                      {PROVEDOR[pagamento.provedor] ?? pagamento.provedor}
                      {pagamento.idExterno && ` · ${pagamento.idExterno}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <EntregaPedido pedido={pedido} />
        </div>
        <ResumoPedido pedido={pedido} />
      </div>
    </>
  );
}
