"use client";

import { useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatarPreco } from "@/modules/catalog/cliente";
import type { ResumoCheckout } from "@/modules/orders";

type Recusa = { ok: false; erro: string; mensagem: string };
type Props = ResumoCheckout & {
  // URL pública do R2 (R2_PUBLIC_URL); sem ela, a foto vira um espaço reservado.
  baseImagens: string | null;
  // Server Action: em sucesso redireciona para o pedido; só volta quando recusa.
  finalizar: (entrada: { modalidade: "RETIRADA" }) => Promise<Recusa>;
};

const ROTULO_ETAPA =
  "grid size-8 shrink-0 place-items-center rounded-campo border-2 border-neutro-grafite bg-primary font-display text-primary-foreground";
const CARTAO =
  "grid gap-4 rounded-card border-2 border-neutro-grafite bg-[var(--kolo-superficie)] p-5 text-[var(--kolo-superficie-texto)] shadow-adesivo-sm";

// RF12: tudo o que aparece aqui veio calculado do servidor; a tela não soma nem decide preço.
export function CheckoutCompra({
  itens,
  endereco,
  subtotalCentavos,
  freteCentavos,
  totalCentavos,
  baseImagens,
  finalizar,
}: Props) {
  const [pendente, setPendente] = useState(false);
  const [recusa, setRecusa] = useState<Recusa | null>(null);
  const base = baseImagens?.replace(/\/+$/, "") ?? null;

  async function enviar() {
    setPendente(true);
    setRecusa(null);
    try {
      setRecusa(await finalizar({ modalidade: "RETIRADA" }));
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
            {/* PBI-26: retirada é a modalidade mínima; entregas com custo entram no PBI-42. */}
            <label className="flex items-start gap-3 rounded-campo border-2 border-[var(--kolo-contorno)] p-4">
              <input
                type="radio"
                name="modalidade"
                value="RETIRADA"
                checked
                readOnly
                className="mt-1 size-4 accent-[var(--primary)]"
              />
              <span className="grid flex-1 gap-1">
                <span className="font-display uppercase">Retirada no ateliê</span>
                <span className="text-nota">Sem custo de envio.</span>
              </span>
              <span className="text-right font-display">
                {formatarPreco(0)}
                <span className="block text-nota uppercase">Grátis</span>
              </span>
            </label>
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
              <dt>Retirada no ateliê</dt>
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
