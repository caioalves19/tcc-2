# PBI-18 — CRUD administrativo de obras

**Referências:** RF26, RN02, RN07, RN10, RN11 e RNF21. **Dependências:** PBI-16 e PBI-17.

## Objetivo e contrato confirmado

Disponibilizar `/admin/obras`, só para ADMIN, com cadastro, listagem, edição e exclusão de obras e
gestão das imagens de cada obra. Decisões confirmadas com o Robert antes de codar (05/10/2026):

- **Situação derivada do estoque (RN11):** o admin escolhe só entre rascunho e publicada. Publicada
  fica DISPONÍVEL com estoque maior que 0 e ESGOTADA com estoque 0. A regra está em
  `situacaoPorEstoque` (`src/modules/catalog/regras.ts`) e serve também a quem mexer no estoque
  depois (reserva e webhook, PBIs 25 e 28).
- **Exclusão:** obra sem vínculo é apagada de vez, com as imagens e miniaturas no R2. Obra em
  carrinho ou pedido recebe exclusão lógica (`excluido_em`): some do admin e deve sumir da vitrine,
  volta a rascunho, perde o destaque, e o histórico dos pedidos fica intacto.
- **Publicar exige imagem:** sem pelo menos uma imagem, a obra não sai de rascunho. Toda imagem tem
  texto alternativo obrigatório (RNF21).
- **Dados primeiro, imagens depois:** a obra nasce como rascunho, e as imagens entram na tela de
  edição, já ligadas a ela.

Implementação no módulo `src/modules/catalog` (previsto no ESCOPO), com API pública em `index.ts` e
funções puras para o navegador em `cliente.ts`. A checagem de ADMIN reaproveita o `comoAdmin` do
PBI-16, agora exportado pela API pública de `artists`. Não houve mudança de schema.

## Comportamentos

- **Ficha:** título (2 a 160 caracteres), slug (letras minúsculas, números e hífens, único; a tela
  sugere a partir do título), descrição, artista existente, técnica, dimensões, ano (de 1900 até o
  ano atual) e até 30 tags existentes, sem repetição.
- **Preço (RN07):** digitado em reais no formato brasileiro ("1.234,56"), guardado em centavos
  inteiros, de R$ 1,00 a R$ 1.000.000,00.
- **Estoque (RN02):** padrão 1, inteiro de 0 a 999.
- **Imagens, pelo contrato do PBI-17:** a chave só é gravada em `artwork_image` depois que o servidor
  confere que ela é da pasta do artista da obra e o `processarImagem` aceita o arquivo e gera a
  miniatura. O processamento roda fora da transação do banco.
  - A primeira imagem vira a principal.
  - Trocar a principal e reordenar respeitam a ordem única por obra; a troca passa por -1.
  - Remover apaga o original e a miniatura do R2 e passa a principal adiante.
  - A última imagem de obra publicada não pode ser removida.
- **R2:** objetos só saem do bucket depois que o banco confirma. Se o R2 falhar, a falha vai para o
  log e sobra um objeto órfão, mas a obra fica consistente.
- **Tela:**
  - na tela, o envio de imagem só é liberado depois do texto alternativo, para não subir arquivo
    que não possa ser gravado;
  - sem `R2_PUBLIC_URL`, a lista mostra "Sem prévia" no lugar da miniatura;
  - depois do cadastro, a obra abre em edição para receber as imagens.

## Validação

Seams: funções públicas de `src/modules/catalog`, as regras puras e os componentes `GestaoObras` e
`GestaoImagensObra`.

- `npm run test:unit -- catalogo-regras`: preço em reais e centavos, situação pelo estoque, ficha e
  seus limites, slug sugerido.
- `npm run test:integration -- catalogo-obras` (PostgreSQL real):
  - cadastrar, listar, editar, publicar e despublicar;
  - permissões de quem não é ADMIN;
  - vínculos inexistentes e slug repetido;
  - exclusão de vez e exclusão lógica com carrinho e pedido.
- `npm run test:integration -- catalogo-imagens` (PostgreSQL real, R2 simulado com PNG de verdade):
  - adicionar com processamento;
  - recusar chave de outra artista, fora do formato, inexistente ou sem texto alternativo;
  - principal, ordem, texto e remoção.
- `npm run test:unit -- gestao-obras gestao-imagens-obra admin-layout`: formulário, lista, edição,
  confirmação de exclusão, envio liberado pelo texto alternativo e ações de cada imagem.

**Conferência no navegador** (06/10/2026, Postgres local), com sessão de ADMIN:

1. Cadastrou como rascunho e abriu a edição.
2. Recusou publicar sem imagem.
3. Com uma imagem simulada no banco, publicou como disponível; com estoque 0, virou esgotada.
4. Barrou a remoção da última imagem da obra publicada.
5. Excluiu a obra e as imagens, registrando no log a falha esperada do R2 sem chaves.
6. Em 1440 e 320 px não há rolagem horizontal; o axe-core 4.10.2 não acusou violações.

**Observação para o Windows:** neste PC, rodar a suíte de integração com arquivos em paralelo
estoura o limite de 5 s em testes de outros PBIs. Em sequência
(`npx vitest run --config vitest.integration.config.ts --no-file-parallelism`), os 71 passam.

## Pendências e limites conhecidos

- **Envio real de imagem pela tela, com o R2 de verdade:** depende das chaves do R2 no `.env`. Os
  testes cobrem o fluxo com o R2 simulado, e o envio real ao bucket já foi comprovado no PBI-17.
- **A vitrine (PBIs 19, 20 e 21) precisa filtrar `excluido_em IS NULL` e a situação.** Uma obra
  arquivada mantém o slug, então um slug novo igual ao de uma obra arquivada é recusado.
- **A persistência da imagem do PBI-17 fica completa para obras;** para o portfólio, segue com o
  PBI-35.
