# Imagens de demonstração (PBI-49)

Imagens das 8 obras e das 9 tatuagens fictícias usadas para demonstrar o catálogo, a home e o
portfólio, inclusive na banca. **São ilustrativas, geradas por IA, e não fazem parte do acervo
real do Kolô.** A descrição de cada obra e de cada tatuagem termina com esse aviso.

## O que tem aqui

| Arquivo | Papel |
| --- | --- |
| `catalogo.ts` | Fonte única dos dados: artista, estilos e obras do seed de demonstração, texto alternativo e prompt de cada imagem, e as tatuagens (id fixo) |
| `imagens/` | As 34 imagens WebP já geradas (17 imagens e as miniaturas `_thumb.webp`, de 400 px). Versionadas para ninguém depender da IA de novo |
| `gerar.ts` | Gera `imagens/` a partir dos prompts. Só é preciso para trocar alguma imagem |
| `popular.ts` | Envia as imagens ao R2 (ou a `public/<pasta>` com `R2_PUBLIC_URL` relativa) e grava `artwork_image` e `portfolio_item`. Pode rodar de novo sem duplicar |
| `../seed-demo.ts` | `npm run db:seed:demo`: cria a artista `demo-marina-duarte`, os estilos `demo-*` e as obras `demo-*` que o `popular.ts` procura |

A ordem dos comandos está no README da raiz, na seção “Dados de demonstração”.

## Origem e licença

- **Gerador:** [Pollinations.ai](https://pollinations.ai), API pública sem chave
  (`image.pollinations.ai`), modelo `flux`, 1024 × 768, semente fixa por prompt. Imagens geradas
  em outubro de 2026.
- **Termos:** os [Termos de Serviço da Pollinations](https://github.com/pollinations/pollinations/blob/main/pollinations.ai/public/legal/TERMS_OF_SERVICE.md)
  (versão de 10/10/2026, seção 8) não definem uma licença para as imagens geradas. Dizem só que
  “model licences vary; verify before commercial use”. A Pollinations não informa qual versão do
  FLUX está por trás do modelo `flux`. O FLUX.1 [schnell], por exemplo, é Apache 2.0, mas isso
  não foi confirmado para este serviço.
- **Uso neste repositório:** só demonstração acadêmica (TCC), sem venda e sem fins comerciais.
  As obras e as tatuagens são fictícias. **Não use estas imagens no ambiente de produção do
  cliente.** Antes do lançamento, apague os dados de demonstração e cadastre o acervo real pelas
  telas de administração.
- **Marca d'água:** o plano gratuito carimba o logo da Pollinations no canto inferior direito, e
  o `gerar.ts` corta essa faixa. O crédito à Pollinations fica neste README.

## Como regenerar

```bash
npx tsx prisma/imagens-demo/gerar.ts            # só gera as imagens que faltam
npx tsx prisma/imagens-demo/gerar.ts --forcar   # gera todas de novo
```

Para trocar uma imagem, edite o prompt em `catalogo.ts`, apague o arquivo em `imagens/` (e a
miniatura) e rode o primeiro comando. A semente vem do prompt: o mesmo prompt tende a gerar a
mesma imagem, mas a Pollinations não garante isso. Depois rode o `popular.ts` de novo.
