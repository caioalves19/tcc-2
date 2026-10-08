"use client";

import { useState } from "react";
import { unstable_rethrow, useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatarPreco } from "@/modules/catalog/cliente";

type ItemCarrinho = {
  obraId: string;
  titulo: string;
  artistaNome: string;
  precoCentavos: number;
  quantidade: number;
  estoque: number;
  disponivel: boolean;
  chaveMiniatura: string | null;
  textoAlternativo: string;
};
type Resultado = { ok: true } | { ok: false; mensagem: string };
type Props = {
  itens: ItemCarrinho[];
  totalCentavos: number;
  unidades: number;
  indisponiveis: number;
  // URL pública do R2 (R2_PUBLIC_URL); sem ela, a foto vira um espaço reservado.
  baseImagens: string | null;
  alterar: (obraId: string, quantidade: number) => Promise<Resultado>;
  remover: (obraId: string) => Promise<Resultado>;
};

// RF11: preço, total e disponibilidade chegam prontos do servidor; a tela só exibe.
export function CarrinhoCompras({
  itens,
  totalCentavos,
  unidades,
  indisponiveis,
  baseImagens,
  alterar,
  remover,
}: Props) {
  const router = useRouter();
  const [pendente, setPendente] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const base = baseImagens?.replace(/\/+$/, "") ?? null;

  async function executar(acao: () => Promise<Resultado>) {
    setPendente(true);
    setErro(null);
    try {
      const resultado = await acao();
      if (resultado.ok) router.refresh();
      else setErro(resultado.mensagem);
    } catch (falha) {
      unstable_rethrow(falha);
      setErro("Não foi possível atualizar o carrinho agora. Tente novamente.");
    } finally {
      setPendente(false);
    }
  }

  return (
    <>
      <h1 className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
        Seu carrinho
      </h1>
      {erro && (
        <p role="alert" className="mt-4 text-destructive">
          {erro}
        </p>
      )}
      {itens.length === 0 ? (
        <div className="mt-8 grid max-w-md gap-4">
          <p>Seu carrinho está vazio.</p>
          <a href="/" className={buttonVariants({ variant: "contorno" })}>
            Voltar ao início
          </a>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <ul aria-label="Obras no carrinho" className="grid content-start gap-4">
            {itens.map((item) => (
              <li
                key={item.obraId}
                className="grid gap-4 rounded-card border-2 border-neutro-grafite bg-[var(--kolo-superficie)] p-4 text-[var(--kolo-superficie-texto)] shadow-adesivo-sm sm:grid-cols-[8rem_minmax(0,1fr)]"
              >
                {base && item.chaveMiniatura ? (
                  // Miniatura WebP do R2 (PBI-17); next/image fica para a vitrine.
                  <img
                    src={`${base}/${item.chaveMiniatura}`}
                    alt={item.textoAlternativo}
                    width={128}
                    height={128}
                    loading="lazy"
                    className={`size-32 rounded-campo object-cover ${item.disponivel ? "" : "opacity-50 grayscale"}`}
                  />
                ) : (
                  <div className="grid size-32 place-items-center rounded-campo border-2 border-dashed border-[var(--kolo-contorno)] text-nota">
                    Sem foto
                  </div>
                )}
                <div className="grid min-w-0 content-start gap-2">
                  <h2 className="break-words font-display text-titulo-lg">{item.titulo}</h2>
                  <p className="text-nota">{item.artistaNome}</p>
                  <p className="font-display text-preco">
                    {formatarPreco(item.precoCentavos)}
                    {item.quantidade > 1 && ` × ${item.quantidade}`}
                  </p>
                  {!item.disponivel ? (
                    <p role="status" className="font-semibold text-destructive">
                      Indisponível: esta obra esgotou ou saiu da vitrine. Remova-a para seguir.
                    </p>
                  ) : item.estoque > 1 ? (
                    <div className="flex items-center gap-2">
                      <span aria-hidden className="text-nota">
                        Quantidade
                      </span>
                      <select
                        aria-label={`Quantidade de ${item.titulo}`}
                        value={item.quantidade}
                        disabled={pendente}
                        onChange={(evento) =>
                          void executar(() => alterar(item.obraId, Number(evento.target.value)))
                        }
                        className="rounded-campo border-2 border-[var(--kolo-contorno)] bg-transparent px-2 py-1"
                      >
                        {Array.from({ length: item.estoque }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <span className="text-nota">(máx. {item.estoque})</span>
                    </div>
                  ) : (
                    <p className="text-nota">Peça única</p>
                  )}
                  <div>
                    <Button
                      type="button"
                      variant="contorno"
                      size="sm"
                      disabled={pendente}
                      aria-label={`Remover ${item.titulo} do carrinho`}
                      onClick={() => void executar(() => remover(item.obraId))}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <aside
            aria-labelledby="resumo-titulo"
            className="grid content-start gap-4 rounded-card border-2 border-neutro-grafite p-5"
          >
            <h2 id="resumo-titulo" className="font-display text-titulo-lg">
              Resumo do pedido
            </h2>
            <dl className="grid gap-2">
              <div className="flex justify-between gap-4">
                <dt>
                  Subtotal ({unidades} {unidades === 1 ? "unidade" : "unidades"})
                </dt>
                <dd>{formatarPreco(totalCentavos)}</dd>
              </div>
              <div className="flex justify-between gap-4 text-nota">
                <dt>Frete</dt>
                <dd>Calculado no checkout</dd>
              </div>
              <div className="flex justify-between gap-4 border-t-2 border-neutro-grafite pt-2 font-display text-titulo-lg">
                <dt>Total</dt>
                <dd>{formatarPreco(totalCentavos)}</dd>
              </div>
            </dl>
            {indisponiveis > 0 && (
              <p className="text-nota">Obras indisponíveis não entram no total.</p>
            )}
            {/* PBI-26: o checkout recusa obra indisponível; o caminho só abre sem elas. */}
            {indisponiveis > 0 ? (
              <>
                <Button type="button" disabled>
                  Finalizar compra
                </Button>
                <p className="text-nota">Remova as obras indisponíveis para finalizar.</p>
              </>
            ) : (
              <a href="/checkout" className={buttonVariants()}>
                Finalizar compra
              </a>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
