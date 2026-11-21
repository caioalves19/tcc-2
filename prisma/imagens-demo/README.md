# Dados de demonstração (PBI-49)

Artistas, obras e tatuagens usados para demonstrar o catálogo, a home, o portfólio e o
agendamento, inclusive na banca. **As pessoas e os trabalhos são reais, do Kolô**; o que é
fictício é a venda: preço e disponibilidade de cada obra (a descrição termina com esse aviso) e a
duração das tatuagens.

## O que tem aqui

| Arquivo | Papel |
| --- | --- |
| `catalogo.ts` | Fonte única: os 4 artistas (Melanie, Rafael, Cogu e Pucca), os estilos de cada tatuador, as 7 obras e as 10 tatuagens (id fixo), com o post de origem de cada foto |
| `imagens/` | As 17 fotos em WebP (lado maior até 1600 px) e as miniaturas `_thumb.webp`, de 400 px |
| `popular.ts` | Envia as imagens ao R2 (ou a `public/<pasta>` com `R2_PUBLIC_URL` relativa) e grava `artwork_image` e `portfolio_item`. Pode rodar de novo sem duplicar; move para o novo dono a obra ou tatuagem que mudou de artista |
| `../seed-demo.ts` | `npm run db:seed:demo`: cria os artistas, os estilos e as obras que o `popular.ts` procura, dá login a quem tem `SEED_SENHA_<NOME>` no `.env` e tira do banco a demonstração anterior (a artista fictícia `demo-marina-duarte` e as obras, tatuagens e estilos `demo-*` gerados por IA) |

A ordem dos comandos está no README da raiz, na seção “Dados de demonstração”.

## Origem e autorização

- **Fotos:** posts do Instagram de cada artista ([@melanfetamina](https://www.instagram.com/melanfetamina/),
  [@rafa.lotufo](https://www.instagram.com/rafa.lotufo/), [@co.guh](https://www.instagram.com/co.guh/)
  e [@pucca.ink](https://www.instagram.com/pucca.ink/)). O link de cada post está no campo `origem`
  do `catalogo.ts`. Título, técnica, medidas e ano vêm da legenda quando ela traz.
- **Autorização:** os quatro artistas autorizaram o uso das fotos e dos nomes no sistema, em
  novembro de 2026. As obras continuam deles: a foto não pode ser usada fora do Kolô sem pedir a
  cada um.
- **Pessoas retratadas:** as descrições não citam clientes nem quem aparece nas fotos.

## Trocar ou incluir uma foto

1. Converta a foto para `imagens/obras/<slug>.webp` ou `imagens/tatuagens/<id>.webp` (lado maior
   até 1600 px, qualidade 82) e gere a miniatura `_thumb.webp` com 400 px de largura.
2. Cadastre ou ajuste o item em `catalogo.ts`, com o post de origem.
3. Rode `npm run db:seed:demo` e depois o `popular.ts`.
