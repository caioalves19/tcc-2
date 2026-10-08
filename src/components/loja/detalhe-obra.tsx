import { buttonVariants } from "@/components/ui/button";
import { BotaoAdicionarAoCarrinho } from "@/components/loja/botao-adicionar-carrinho";
import { CardObra } from "@/components/loja/card-obra";
import { GaleriaObra } from "@/components/loja/galeria-obra";
import { CONTATO } from "@/lib/contato";
import type { CardObra as DadosCard, ObraPublica } from "@/modules/catalog";
import { formatarPreco } from "@/modules/catalog/cliente";

type Resultado = { ok: true } | { ok: false; mensagem: string };
type Props = {
  obra: ObraPublica;
  outras: DadosCard[];
  // URL pública do R2 (R2_PUBLIC_URL); sem ela, as fotos viram espaço reservado.
  baseImagens: string | null;
  // adicionarAoCarrinhoAcao (PBI-24): adiciona 1 unidade; a quantidade se ajusta no carrinho.
  adicionar: (obraId: string) => Promise<Resultado>;
};

const CARTAO =
  "grid gap-3 rounded-card border-2 border-neutro-grafite bg-[var(--kolo-superficie)] p-5 text-[var(--kolo-superficie-texto)] shadow-adesivo-sm";

// Sem API oficial do WhatsApp (ESCOPO): só o wa.me do ateliê, com a obra na mensagem.
function linkWhatsapp(obra: ObraPublica): string {
  const mensagem = `Olá! Tenho uma dúvida sobre a obra "${obra.titulo}", de ${obra.artista.nome}.`;
  return `${CONTATO.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}

// RF10/RN11: página pública da obra. Esgotada continua visível, mas sem caminho de compra.
export function DetalheObra({ obra, outras, baseImagens, adicionar }: Props) {
  const ficha = [
    ["Artista", obra.artista.nome],
    ["Técnica", obra.tecnica],
    ["Dimensões", obra.dimensoes],
    ["Ano", obra.ano === null ? null : String(obra.ano)],
  ].filter((linha): linha is [string, string] => Boolean(linha[1]));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Trilha de navegação" className="text-nota">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <a href="/" className="underline-offset-4 hover:underline">
                Início
              </a>
            </li>
            <li aria-hidden>/</li>
            <li>
              <a href="/obras" className="underline-offset-4 hover:underline">
                Obras
              </a>
            </li>
            <li aria-hidden>/</li>
            <li>{obra.artista.nome}</li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="font-semibold">
              {obra.titulo}
            </li>
          </ol>
        </nav>
        <a href="/obras" className={buttonVariants({ variant: "contorno", size: "sm" })}>
          Voltar ao catálogo
        </a>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <GaleriaObra titulo={obra.titulo} imagens={obra.imagens} baseImagens={baseImagens} />

        <div className="grid content-start gap-6">
          <div className="grid gap-2">
            <h1 className="break-words font-display text-titulo-xl-mobile uppercase md:text-titulo-xl">
              {obra.titulo}
            </h1>
            <p>
              Obra de <strong>{obra.artista.nome}</strong>
            </p>
          </div>

          <div className={CARTAO}>
            <p className="font-display text-titulo-xl-mobile md:text-titulo-xl">
              {formatarPreco(obra.precoCentavos)}
            </p>
            {obra.disponivel ? (
              <>
                <p className="font-display text-selo uppercase">Disponível</p>
                <BotaoAdicionarAoCarrinho obraId={obra.id} adicionar={adicionar} />
              </>
            ) : (
              <>
                <p className="w-fit rounded-campo border-2 border-neutro-grafite bg-[var(--kolo-erro-fundo)] px-2 py-1 font-display text-selo uppercase text-[var(--kolo-erro-texto)]">
                  Esgotada
                </p>
                <p className="text-nota">Esta obra não está mais disponível para compra.</p>
              </>
            )}
          </div>

          <a
            href={linkWhatsapp(obra)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Tirar dúvidas com o ateliê pelo WhatsApp"
            className={buttonVariants({ variant: "contorno" })}
          >
            Tirar dúvidas com o ateliê
          </a>

          {obra.descricao && (
            <section aria-labelledby="obra-sobre" className="grid gap-2">
              <h2 id="obra-sobre" className="font-display text-titulo-lg uppercase">
                Sobre a obra
              </h2>
              <p className="whitespace-pre-line">{obra.descricao}</p>
            </section>
          )}

          <section aria-labelledby="obra-ficha" className={CARTAO}>
            <h2 id="obra-ficha" className="font-display text-titulo-lg uppercase">
              Ficha técnica
            </h2>
            <dl className="grid gap-2">
              {ficha.map(([rotulo, valor]) => (
                <div
                  key={rotulo}
                  className="flex justify-between gap-4 border-b border-[var(--kolo-contorno)] pb-2"
                >
                  <dt className="text-nota">{rotulo}</dt>
                  <dd className="text-right">{valor}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      {outras.length > 0 && (
        <section aria-labelledby="obra-outras" className="mt-16 grid gap-6">
          <h2
            id="obra-outras"
            className="font-display text-titulo-xl-mobile uppercase md:text-titulo-xl"
          >
            Outras obras de {obra.artista.nome}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {outras.map((outra) => (
              <CardObra key={outra.slug} obra={outra} baseImagens={baseImagens} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
