import { ArrowLeft } from "lucide-react";

import { TITULO_SECAO } from "@/components/conta/partes-pedido";
import { dataDoPedido, EtiquetaSituacao } from "@/components/conta/situacao-pedido";
import { formatarPreco } from "@/modules/catalog/cliente";
import type { ClienteAdmin } from "@/modules/customers";

const SECAO = "grid content-start gap-3";
const LINK = "break-all text-[var(--kolo-link)] underline underline-offset-4";

const SITUACAO_CONTA: Record<ClienteAdmin["situacao"], string> = {
  ATIVO: "Conta ativa",
  INATIVO: "Conta inativa",
};

// RF30 (PBI-38): perfil unificado do cliente para o ADMIN (lerClienteAdmin). Só consulta: as
// ações sobre cada pedido ficam no detalhe dele, em /admin/pedidos.
export function PerfilClienteAdmin({ cliente }: { cliente: ClienteAdmin }) {
  const { endereco, pedidos } = cliente;
  return (
    <>
      <a
        href="/admin/clientes"
        className="inline-flex items-center gap-1 text-[var(--kolo-link)] underline underline-offset-4"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Clientes
      </a>
      {cliente.excluido && (
        <div className="mt-6">
          <span className="inline-block rounded-campo border-2 border-neutro-grafite bg-[var(--kolo-erro-fundo)] px-2 py-1 font-display text-etiqueta uppercase text-[var(--kolo-erro-texto)]">
            Conta excluída
          </span>
        </div>
      )}
      <h1 className="mt-3 break-words font-display text-2xl">{cliente.nome}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section aria-labelledby="cliente-compras" className={SECAO}>
          <h2 id="cliente-compras" className={TITULO_SECAO}>
            Compras
          </h2>
          <p className="font-display text-lg">
            Total gasto: {formatarPreco(cliente.totalGastoCentavos)}
          </p>
          {pedidos.length === 0 ? (
            <p>Nenhuma compra.</p>
          ) : (
            <>
              <p className="text-nota">
                {pedidos.length === 1 ? "1 pedido" : `${pedidos.length} pedidos`}
              </p>
              <ul aria-label="Pedidos do cliente" className="grid gap-3">
                {pedidos.map((pedido) => (
                  <li
                    key={pedido.numero}
                    className="relative grid gap-2 rounded-card border-2 border-neutro-grafite bg-[var(--kolo-superficie)] p-4 text-[var(--kolo-superficie-texto)] focus-within:ring-3 focus-within:ring-ring/50 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div className="grid min-w-0 gap-1">
                      <h3 className="break-words font-display text-lg">
                        <a
                          href={`/admin/pedidos/${pedido.numero}`}
                          className="after:absolute after:inset-0 focus-visible:outline-none"
                        >
                          Pedido {pedido.numero}
                        </a>
                      </h3>
                      <p className="text-nota">
                        {dataDoPedido(pedido.criadoEm)} ·{" "}
                        {pedido.unidades === 1 ? "1 item" : `${pedido.unidades} itens`}
                      </p>
                    </div>
                    <div className="grid justify-items-start gap-2 sm:justify-items-end">
                      <EtiquetaSituacao situacao={pedido.situacao} modalidade={pedido.modalidade} />
                      <p className="font-display">{formatarPreco(pedido.totalCentavos)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <div className="grid content-start gap-8">
          <section aria-labelledby="cliente-dados" className={SECAO}>
            <h2 id="cliente-dados" className={TITULO_SECAO}>
              Dados
            </h2>
            <a href={`mailto:${cliente.email}`} className={LINK}>
              {cliente.email}
            </a>
            <p>{cliente.telefone ?? "Sem telefone"}</p>
            <p>Cliente desde {dataDoPedido(cliente.cadastradoEm)}</p>
            <p>{SITUACAO_CONTA[cliente.situacao]}</p>
          </section>

          <section aria-labelledby="cliente-endereco" className={SECAO}>
            <h2 id="cliente-endereco" className={TITULO_SECAO}>
              Endereço de entrega
            </h2>
            {endereco ? (
              <address className="grid gap-1 not-italic">
                <strong>{endereco.destinatario}</strong>
                <span>
                  {endereco.logradouro}, {endereco.numero}
                  {endereco.complemento && ` — ${endereco.complemento}`}
                </span>
                <span>
                  {endereco.bairro}, {endereco.cidade} / {endereco.uf} · CEP {endereco.cep}
                </span>
              </address>
            ) : (
              <p>Nenhum endereço cadastrado.</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
