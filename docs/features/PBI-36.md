# PBI-36 — Galeria pública de tatuagens

## Objetivo e contrato

Implementar RF17 e RN01 em `/tatuagens`, seguindo as páginas públicas existentes. A página consome somente `listarGaleria` da API pública `src/modules/portfolio/index.ts`. Sem busca textual (PBI-37), alterações de modelo ou novas dependências.

- `listarGaleria({ artista?, estilo?, regiao? })` não recebe sessão. Retorna trabalhos, filtros normalizados e opções disponíveis no acervo público.
- Filtros por identificador de artista, identificador de estilo e região cadastrada; combinados por interseção. A URL e o formulário GET preservam os três valores. Parâmetros repetidos usam o primeiro valor, como no catálogo.
- UUIDs malformados, região vazia ou acima de 100 caracteres são ignorados. Identificadores válidos inexistentes e regiões sem correspondência retornam lista vazia. A interface preserva uma seleção indisponível até o visitante limpar ou trocar o filtro.
- Opções independem dos filtros selecionados, permitindo trocar a combinação mesmo sem resultados. Contas excluídas não aparecem na galeria nem nas opções.
- Trabalhos destacados primeiro, depois ordem cadastrada e identificador como desempate. Retorna apenas dados públicos, sem contato ou credenciais.
- Imagem original servida por `next/image`, `fill` e `sizes`, grade de uma, duas ou quatro colunas. Texto alternativo deriva do título cadastrado, nome do artista e região, quando existente; o modelo atual não possui campo separado de texto alternativo.
- Sem configuração de `R2_PUBLIC_URL`, apresenta “Imagem indisponível”. Não há alteração no upload ou no armazenamento.
- Estados vazios distintos para acervo sem trabalhos e combinação sem resultados, com limpeza dos filtros. Navegação desktop/mobile aponta para `/tatuagens`.
- Rota dinâmica reflete as alterações do portfólio nas próximas consultas.

## Base e situação

Branch local `feat/pbi-36-galeria-publica`, criada a partir de `ff3485a` (`origin/docs/pbi35-validacao-r2`) em 13/10/2026. As referências consultadas mostram a implementação do PBI-35 integrada pelo PR #57; a branch usada como base acrescenta a evidência real do R2 e ainda aguarda aprovação/merge segundo o responsável. O aceite integrado do PBI-36 continua pendente desse acompanhamento, revisão humana e PR aprovado e integrado. Publicação autorizada pelo responsável em 13/10/2026. O PR do PBI-36 usa `docs/pbi35-validacao-r2` como base enquanto o [PR #62](https://github.com/caioalves19/tcc-2/pull/62) estiver aberto, isolando as mudanças da galeria para revisão. Após integrar o #62, conferir a base do PR do PBI-36 contra `main`. Nenhum merge autorizado ou realizado.

## Evidências

Desenvolvimento em ciclos TDD: consulta inicialmente falhou com `listarGaleria is not a function`; página inicialmente inexistente; estado vazio e navegação falharam antes de suas implementações. Todos esses testes passaram após os respectivos incrementos.

- `tests/integration/galeria-publica.test.ts`: PostgreSQL real em banco descartável; interseção tripla, filtros isolados e pares, ausência de resultados, entradas inválidas, opções, ordenação e exclusão de conta.
- `tests/unit/pagina-galeria.test.tsx`: página sem autenticação, parâmetros repetidos, imagem real do Next com `srcset`/`sizes` e `alt`, campos rotulados, GET, ausência de busca, estados vazios e navegação.
- `tests/unit/links-internos.test.tsx`: expectativa provisória do menu atualizada para a rota pública agora existente.
- Revisão independente pela skill `reviewing-code`: **PASS**, sem achados de código.

Gates executados em 13/10/2026:

| Comando                                                                 | Resultado                                                                             |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `npm run lint`                                                          | Passou, sem erros                                                                     |
| `npm run typecheck`                                                     | Passou                                                                                |
| `npm test`                                                              | 98 arquivos, 468 testes passaram                                                      |
| `npm run test:integration -- tests/integration/galeria-publica.test.ts` | 3 testes passaram com PostgreSQL real                                                 |
| `npm run test:integration`                                              | 37 arquivos, 249 testes passaram com PostgreSQL real                                  |
| `npm run format:check`                                                  | Passou                                                                                |
| `npm run build -- --webpack`                                            | Passou; `/tatuagens` aparece como rota dinâmica                                       |
| `npm run build`                                                         | Bloqueado no Turbopack por restrição de criação de processo/porta interna do ambiente |

A troca da base exigiu `npm run db:generate`: o cliente Prisma gerado localmente ainda refletia a branch anterior, causando falhas de tipagem e na primeira regressão de integração. Nenhuma alteração de schema ou migração foi necessária. A suíte unitária também identificou a expectativa provisória do menu da home; ela foi atualizada para a rota do RF17.

Validação visual em navegador e E2E real não executados; o script E2E do repositório permanece um placeholder, tratado no PBI-45. Os testes de renderização verificam a estrutura responsiva e acessível, mas não substituem inspeção visual em dispositivos nem medição de desempenho.
