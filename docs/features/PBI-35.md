# PBI-35 — Gestão do portfólio

**Referências:** RF19, RN10 e contrato de upload do PBI-17. Dependências: PBI-16 e PBI-17.

## Pedido confirmado

- Incluir, editar, ordenar, destacar e remover trabalhos, associando artista, estilos e região do corpo.
- Tela compartilhada em `/portfolio/gestao`: ADMIN seleciona o artista; ARTISTA vê somente seu portfólio.
- Ordenação por artista com botões “Mover para cima/baixo”.
- Galeria pública e busca ficam nos PBIs 36/37.
- Testes pela API pública de `src/modules/portfolio/index.ts`, Server Actions e componentes.
- Gate: `npm run lint`, `npm run typecheck`, `npm test` e `npm run test:integration`.

## Comportamento

- Um trabalho tem uma imagem, título obrigatório (3–200 caracteres), descrição opcional (até 2000),
  região do corpo opcional (até 80), estilos existentes e destaque. O título é o texto alternativo
  da imagem. Destaques são independentes; não há limite de um por artista.
- O artista é definido no cadastro e permanece o mesmo na edição. O ADMIN pode selecionar outro
  portfólio para cadastrar ou editar os trabalhos daquele artista.
- A chave deve pertencer à pasta `portfolio/<artistId>/`. Cadastro e substituição de imagem chamam
  `processarImagem` no servidor antes da persistência, mesmo que o navegador já tenha processado.
  Sem imagem nova na edição, a atual é preservada.
- A sessão, o papel, a situação da conta e o vínculo com artista são relidos no banco em cada
  operação, inclusive depois do processamento da imagem. Sem sessão, a página redireciona ao login.
  CLIENTE e conta excluída/inativa são recusados. Um trabalho de outro artista responde
  `nao_encontrado`, sem revelar sua existência.
- As escritas usam transações Serializable; conflitos devolvem mensagem para atualizar e tentar
  novamente. Inclusões entram no fim da lista. Mover troca com o vizinho do mesmo artista; na
  borda, nada muda. Lacunas deixadas por exclusões não afetam a ordenação.
- A remoção exige confirmação na interface e exclui o registro e seus vínculos de estilos.
- A gestão usa `next/image`, o componente `UploadImagem`, estados vazios e mensagens de falha/sucesso.
  O cabeçalho oferece “Portfólio” para ARTISTA e ADMIN. Salvar fica bloqueado enquanto há
  upload/processamento pendente.

## API pública

- `lerPortfolio(cabecalhos, artista?)`: dados da gestão e opções; parâmetro de outro artista é
  ignorado para ARTISTA. ADMIN sem seleção recebe a tela para escolher artista.
- `criarTrabalho(entrada, cabecalhos, armazenamento?)`: retorna o ID cadastrado.
- `editarTrabalho(entrada, cabecalhos, armazenamento?)`: atualiza ficha, estilos, destaque e imagem opcional.
- `moverTrabalho({ id, direcao: "antes" | "depois" }, cabecalhos)`.
- `removerTrabalho(id, cabecalhos)`.

## Limites

- Objetos substituídos ou removidos permanecem no R2. A remoção tira o trabalho do banco; não revoga
  URLs públicas já conhecidas. Limpeza de objetos órfãos demanda uma política separada, considerando
  que uma imagem pode estar referenciada por mais de um trabalho.
- Sem migração: usa `portfolio_item` e `portfolio_item_style` existentes. Duração opcional do DER
  não é exposta nesta fatia.

## Validação

- `tests/integration/portfolio.test.ts`: PostgreSQL real e armazenamento de teste com PNG real
  decodificado pelo `sharp`; cadastro, relações, leitura restrita, edição, destaque, imagem inválida,
  troca de imagem, ordenação, bordas, remoção, autorização revogada e concorrência.
- `tests/unit/gestao-portfolio.test.tsx`: upload obrigatório, formulário, seleção de artista,
  destaque, ordenação, confirmação de remoção e preservação de dados quando ocorre erro.
- `tests/unit/pagina-portfolio.test.tsx`, `portfolio-acoes.test.ts`, `cabecalho.test.tsx`:
  acesso à página, filtro da URL, encaminhamento da sessão, revalidação e links da equipe.

## Evidências de 12/10/2026

- Lint e TypeScript passaram. `npm test`: 443 testes; `npm run test:integration`: 203 testes,
  em 31 arquivos, incluindo os 9 testes de portfólio.
- Ambiente sincronizado com `npm ci`: o pacote já declarado `mercadopago` estava ausente e o cliente
  Prisma gerado estava desatualizado. Nenhum ajuste de dependência ou schema foi necessário.
- Navegador com banco descartável `kolo_pbi35_test`: visitante redirecionado ao login; ADMIN
  selecionou Ana, abriu a edição, alterou título/destaque e recebeu “Trabalho salvo”; lista atualizada.
  Viewports de 320 e 375 px sem overflow horizontal, incluindo menu aberto no menor tamanho.
- Upload validado em testes com PNG real e armazenamento em memória; não foi realizado envio ao
  bucket R2 real pelo navegador. As imagens do banco descartável não estão no bucket.
- Revisão própria realizada sobre autorização, persistência, concorrência e fluxo de upload.
  A primeira tentativa de revisão independente foi bloqueada pelo limite de uso da conta.
  A revisão foi retomada e concluída conforme registro abaixo. Não houve commit, push ou publicação.

## Revisão independente e correções após conferência do usuário

- Trabalho movido da `main` para `feat/pbi-35-portfolio`, preservando todas as alterações sem commits.
- Header ADMIN corrigido: altura fixa de 80 px mais borda, uma linha, navegação e ações com o mesmo
  breakpoint `xl`; abaixo dele todos os controles da conta ficam disponíveis pelo menu. Conferido
  a 1280 e 1440 px como ADMIN e a 1440 px como ARTISTA; menu a 1024 px; formulário a 320 px
  sem rolagem horizontal.
- Uma nova seleção de imagem invalida a chave da tentativa anterior antes de validar o arquivo.
  Se a tentativa falha, salvar fica bloqueado até repetir o envio com sucesso ou, na edição,
  selecionar “Manter imagem atual”. Teste de regressão usa `UploadImagem` real:
  A sucesso → B falha → salvar bloqueado → manter original sem enviar chave.
- R2 ausente retorna `nao_configurado` e a mensagem “O envio de imagens ainda não está configurado.
  Avise a administração.” O erro foi reproduzido no navegador com um PNG de teste, sem gravar
  trabalho nem enviar objeto. Conta/bucket/credenciais ainda precisam ser configurados pelo usuário.
- O [README](../../README.md#upload-de-imagens--pbi-17) tem o passo a passo para bucket de teste,
  token restrito, endereço público, variáveis locais e CORS.
- **Revisão independente: PASS**, sem achados bloqueantes após correção. O revisor verificou
  autorização, contratos e fluxo de upload e executou 27 testes em 7 arquivos. Revisão somente leitura,
  feita por outro agente; o envio real ao bucket permanece pendente de configuração externa.
- Verificações desta rodada: lint e TypeScript; 444 testes unitários em 93 arquivos; 204 testes
  de integração em 31 arquivos. A suíte específica de portfólio e assinatura passou (15 testes).

## Validação real do R2 — 13/10/2026

- Configuração local preenchida pelo usuário para o bucket `kolo-imagens-teste`. O primeiro
  preflight falhou com 403; após configurar CORS, respondeu 204 para `http://localhost:3000`
  e `http://localhost:3100`. Nenhuma alteração de código foi necessária nesta rodada.
- Código da branch testado em cópia isolada na porta 3100, com banco descartável
  `kolo_pbi35_r2_real_test`, sem alterar a `main` ou o banco de desenvolvimento.
- Envio real pela API pública: PUT 200, processamento com `sharp`, miniatura WebP de 400 px
  de largura, URL pública 200 e persistência do trabalho no PostgreSQL.
- Navegador como ADMIN: cadastro com PNG, título, descrição, região do corpo, estilo e destaque;
  substituição por WebP; ordenação. Imagens renderizadas com `next/image` e dados/ordem
  preservados após recarregar a página.
- Navegador como ARTISTA: envio e cadastro no próprio portfólio. A URL com o ID de outro
  artista não revelou seus trabalhos; a imagem própria carregou após recarregar.
- API pública: remoção de trabalho alheio recusada com `nao_encontrado`; remoção pelo ADMIN
  eliminou os três trabalhos de teste e os vínculos de estilos.
- Limpeza explícita dos objetos desta validação: quatro originais e quatro miniaturas removidos
  do bucket de teste, com ausência confirmada. Essa limpeza foi feita pelo teste; a aplicação
  continua com o limite de retenção de objetos documentado acima.
- A pendência de envio real ao R2 está resolvida. A revisão independente PASS e os gates
  anteriores continuam aplicáveis ao mesmo código. A implementação já foi integrada à `main` pelo PR #57 em 12/10/2026; o aceite humano
  segue o processo da sprint.
