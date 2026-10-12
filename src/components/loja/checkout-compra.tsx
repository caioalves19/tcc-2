"use client";

import { useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatarPreco } from "@/modules/catalog/cliente";
import type { ResumoCheckout } from "@/modules/orders";
import { ROTULO_MODALIDADE, type ModalidadeFrete } from "@/modules/orders/cliente";

type Recusa = { ok: false; erro: string; mensagem: string };
type Props = ResumoCheckout & {
  // URL pública do R2 (R2_PUBLIC_URL); sem ela, a foto vira um espaço reservado.
  baseImagens: string | null;
  // Server Action: em sucesso redireciona para o pedido; só volta quando recusa.
  finalizar: (entrada: { modalidade: ModalidadeFrete }) => Promise<Recusa>;
};

const ROTULO_ETAPA =
  "grid size-8 shrink-0 place-items-center rounded-campo border-2 border-neutro-grafite bg-primary font-display text-primary-foreground";
const CARTAO =
  "grid gap-4 rounded-card border-2 border-neutro-grafite bg-[var(--kolo-superficie)] p-5 text-[var(--kolo-superficie-texto)] shadow-adesivo-sm";

const DETALHE_MODALIDADE: Record<ModalidadeFrete, string> = {
  RETIRADA: "Sem custo de envio.",
  ENTREGA: "Enviamos para o endereço acima.",
};

// RF12: preços e frete vieram calculados do servidor. A tela só mostra o total da modalidade
// escolhida; ao finalizar, o servidor recalcula tudo e envia-se só a modalidade (PBI-42).
export function CheckoutCompra({
  itens,
  endereco,
  modalidade: inicial,
  subtotalCentavos,
  modalidades,
  baseImagens,
  finalizar,
}: Props) {
  const [modalidade, setModalidade] = useState<ModalidadeFrete>(inicial);
  const freteCentavos = modalidades.find((m) => m.modalidade === modalidade)?.freteCentavos ?? 0;
  const totalCentavos = subtotalCentavos + freteCentavos;
  const [pendente, setPendente] = useState(false);
  const [recusa, setRecusa] = useState<Recusa | null>(null);
  const base = baseImagens?.replace(/\/+$/, "") ?? null;

  async function enviar() {
    setPendente(true);
    setRecusa(null);
    try {
      setRecusa(await finalizar({ modalidade }));
    } catch (falha) {
      // O redirect de sucesso chega como erro interno do Next e precisa seguir adiante.
      unstable_rethrow(falha);
      setRecusa({
        ok: false,
        erro: "falha",
        mensagem: "Não foi possível finalizar a compra agora. Tente novamente.",
      });
    } finally {
      setPendente(false);
    }
  }

  return (
    <>
      <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
        Finalizar compra
      </h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="grid content-start gap-8">
          <section aria-labelledby="etapa-endereco" className={CARTAO}>
            <h2
              id="etapa-endereco"
              className="flex items-center gap-3 font-display text-titulo-lg uppercase"
            >
              <span aria-hidden className={ROTULO_ETAPA}>
                1
              </span>
              Endereço de entrega
            </h2>
            <address className="grid gap-1 not-italic">
              <strong>{endereco.destinatario}</strong>
              <span>
                {endereco.logradouro}, {endereco.numero}
                {endereco.complemento && ` — ${endereco.complemento}`}
              </span>
              <span>
                {endereco.bairro}, {endereco.cidade} / {endereco.uf}
              </span>
              <span className="font-semibold">CEP {endereco.cep}</span>
            </address>
            <div>
              <a href="/conta" className={buttonVariants({ variant: "contorno", size: "sm" })}>
                Editar endereço
              </a>
            </div>
          </section>

          <section aria-labelledby="etapa-entrega" className={CARTAO}>
            <h2
              id="etapa-entrega"
              className="flex items-center gap-3 font-display text-titulo-lg uppercase"
            >
              <span aria-hidden className={ROTULO_ETAPA}>
                2
              </span>
              Forma de entrega
            </h2>
            {/* PBI-42: frete null é a entrega indisponível para o endereço (UF fora da tabela). */}
            {modalidades.map((opcao) => (
              <label
                key={opcao.modalidade}
                className="flex items-start gap-3 rounded-campo border-2 border-[var(--kolo-contorno)] p-4 has-[:disabled]:opacity-60"
              >
                <input
                  type="radio"
                  name="modalidade"
                  value={opcao.modalidade}
                  checked={modalidade === opcao.modalidade}
                  disabled={opcao.freteCentavos === null}
                  onChange={() => setModalidade(opcao.modalidade)}
                  className="mt-1 size-4 accent-[var(--primary)]"
                />
                <span className="grid flex-1 gap-1">
                  <span className="font-display uppercase">
                    {ROTULO_MODALIDADE[opcao.modalidade]}
                  </span>
                  <span className="text-nota">
                    {opcao.freteCentavos === null
                      ? "Indisponível para o seu endereço."
                      : DETALHE_MODALIDADE[opcao.modalidade]}
                  </span>
                </span>
                {opcao.freteCentavos !== null && (
                  <span className="text-right font-display">
                    {formatarPreco(opcao.freteCentavos)}
                    {opcao.freteCentavos === 0 && (
                      <span className="block text-nota uppercase">Grátis</span>
                    )}
                  </span>
                )}
              </label>
            ))}
          </section>
        </div>

        <aside
          aria-labelledby="resumo-checkout"
          className="grid content-start gap-4 rounded-card border-2 border-neutro-grafite p-5"
        >
          <h2 id="resumo-checkout" className="font-display text-titulo-lg uppercase">
            Resumo do pedido
          </h2>
          <ul className="grid gap-3">
            {itens.map((item) => (
              <li key={item.obraId} className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3">
                {base && item.chaveMiniatura ? (
                  <img
                    src={`${base}/${item.chaveMiniatura}`}
                    alt={item.textoAlternativo}
                    width={64}
                    height={64}
                    loading="lazy"
                    className="size-16 rounded-campo object-cover"
                  />
                ) : (
                  <div className="grid size-16 place-items-center rounded-campo border-2 border-dashed border-[var(--kolo-contorno)] text-nota">
                    Sem foto
                  </div>
                )}
                <div className="grid min-w-0 content-start gap-1">
                  <span className="break-words font-display">{item.titulo}</span>
                  <span className="text-nota">{item.artistaNome}</span>
                  <span className="font-display">
                    {formatarPreco(item.precoCentavos)}
                    {item.quantidade > 1 && ` × ${item.quantidade}`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <dl className="grid gap-2 border-t-2 border-neutro-grafite pt-3">
            <div className="flex justify-between gap-4">
              <dt>Subtotal</dt>
              <dd>{formatarPreco(subtotalCentavos)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{ROTULO_MODALIDADE[modalidade]}</dt>
              <dd>{formatarPreco(freteCentavos)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t-2 border-neutro-grafite pt-2 font-display text-titulo-lg">
              <dt>Total</dt>
              <dd>{formatarPreco(totalCentavos)}</dd>
            </div>
          </dl>
          {recusa && (
            <div role="alert" className="grid gap-2 text-destructive">
              <p>{recusa.mensagem}</p>
              {recusa.erro === "indisponivel" && (
                <a href="/carrinho" className={buttonVariants({ variant: "contorno", size: "sm" })}>
                  Voltar ao carrinho
                </a>
              )}
            </div>
          )}
          <Button type="button" size="lg" disabled={pendente} onClick={() => void enviar()}>
            {pendente ? "Finalizando…" : "Finalizar compra"}
          </Button>
          <p className="text-nota">
            Ao finalizar, as obras ficam reservadas para você por 10 minutos enquanto o pagamento é
            concluído.
          </p>
        </aside>
      </div>
    </>
  );
}
