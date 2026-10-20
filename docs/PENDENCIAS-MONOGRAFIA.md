# Kolô — Pendências da monografia (Grupo 19)

> Versão em edição: `docs/TCC2_Grupo_19_Monografia.md`. O `.docx` só é regenerado quando o `.md` estiver fechado.
> Entrega: 20/10/2026, pelo Teams, com o número do grupo no nome do arquivo.

## Qual arquivo editar

- **Oficial, em edição:** `docs/TCC2_Grupo_19_Monografia.md`. Todos editam este.
- Rascunhos anteriores, só de consulta (não editar): `docs/MONOGRAFIA-TCC2-FINAL.md`, `docs/CAPITULO-1` a `6-*.md` e `docs/TCC.txt` (agora com o texto do rascunho, não mais o do TCC 1; o original está no histórico do Git).
- `.docx` (`TCC2_Grupo_19_Monografia.docx`, `MONOGRAFIA-TCC2-FINAL.docx`): desatualizados; só serão regenerados quando o `.md` fechar.
- Diagramas atuais: blocos Mermaid da monografia, com cópias em `docs/figuras_geradas/fontes/`. Os PNGs antigos das Fig. 4.1 a 4.6 estão desatualizados; os das Fig. 4.7 a 4.12 são protótipos. **Não inserir esses PNGs na versão final.**

## Figuras (mínimo exigido: 5, numeradas e citadas no texto)

Hoje há seis diagramas Mermaid (Fig. 4.1 a 4.6) e sete placeholders de capturas essenciais (Fig. 4.7 a 4.13) no Markdown. Cada placeholder tem título, fonte prevista e comentário editorial com rota, papel de acesso e conteúdo a mostrar.

- [x] Corrigir arquitetura, DER, permissões dos casos de uso, meios de pagamento nas classes e sequências de reserva/webhook; inserir os seis diagramas como Mermaid no Markdown.
- [ ] Na diagramação final, exportar os Mermaid corrigidos em formato compatível com o editor e conferir legibilidade. Os PNGs antigos não foram regenerados.
- [ ] Substituir os placeholders por capturas reais em ambiente de teste:
  - [ ] Fig. 4.7: `/obras`, catálogo com busca e obras.
  - [ ] Fig. 4.8: `/obras/[slug]`, ficha de uma obra disponível.
  - [ ] Fig. 4.9: `/checkout/[numero]`, pedido com reserva ativa e botão de pagar.
  - [ ] Fig. 4.10: `/agendamento`, passo 7, três avisos obrigatórios.
  - [ ] Fig. 4.11: `/tatuagens`, filtros e trabalhos encontrados.
  - [ ] Fig. 4.12: `/admin/pedidos/[numero]`, detalhe administrativo de pedido para entrega.
  - [ ] Fig. 4.13: `/admin/relatorio`, período e resultados de vendas.
- [ ] Ao inserir cada captura, remover o placeholder e a orientação editorial correspondente; manter título acima e fonte abaixo. Não usar protótipos como capturas do sistema.
- [ ] Conferir as chamadas no texto, os títulos da lista de figuras e as páginas após a diagramação.
- [x] Lista de figuras atualizada até a 4.13. Não foram incluídas capturas redundantes de login, cadastro ou carrinho isolado.

## Modelagem (Estrutura da Monografia, Capítulo 4)

- [x] DER e modelo físico (Fig. 4.2, dicionário de dados em 4.3.2), com descrição do recorte do modelo lógico e das cardinalidades opcionais.
- [x] Casos de uso (Fig. 4.3), classes (Fig. 4.4) e sequência (Fig. 4.5 e 4.6), na Seção 4.3.3 e nas Seções 4.4.1 e 4.4.2.

## Referências e citações

- [x] **Artigos científicos**: 13 artigos e 1 dissertação incluídos e citados no texto (Cap. 1, 2, 3 e 5), conferidos no Crossref e nos repositórios. Com a tese de Fielding (2000), o Capítulo 2 cobre os seis tipos pedidos na estrutura: artigos, livros, normas, documentação oficial, dissertação e tese.
- [x] Conferir que cada citação do texto está na lista e vice-versa, depois de entrarem os artigos. A LGPD passou a ser citada como (BRASIL, 2018), e Mercado Pago, PostgreSQL e React, que estavam só na lista, passaram a ser citados no §4.2.2.
- [ ] Manter OWASP 2021 e WCAG 2.1: os títulos da Seção 2.4 usam os códigos de 2021, e o RNF21 e os testes usam a WCAG 2.1. Trocar de versão exigiria renumerar a seção.
- [ ] Não tirar Fielding (2000) da lista: é a única tese citada.
- [x] Tabela 2.1 reescrita só com o que as páginas citadas informam (o resto está como "não identificado").
- [x] Frases sobre "taxas de intermediação" (§1.6 e §6.3.1) reescritas de forma neutra, sem afirmar fato verificável.
- [ ] (Opcional) Procurar fontes específicas sobre dados de saúde em Booksy e sobre reserva de estoque no checkout do Shopify, para reforçar a Tabela 2.1. (Nuvemshop foi removida da tabela por falta de informação verificada.)
- [ ] Endereço do ateliê: os protótipos em `docs/telas/` mostram o rodapé com "Galeria Bixiga"; o texto e o ESCOPO dizem Pinheiros. Confirmar com a Melanie e alinhar protótipos e site.
- [x] Referências de sites com título da página, "[S. l.]" e acesso em 19/10/2026.

## Testes e números (main com o PBI-48)

- [x] Testes unitários remedidos em 19/10/2026 na `main`: 562 testes em 122 arquivos, todos aprovados.
- [ ] Reexecutar `npm run test:integration` (precisa do Docker/Postgres) e `npm run test:e2e` na `main` e atualizar os números no resumo, abstract, §5.1, §6.1 e §6.3.2. O texto traz 276 e 43, da rodada de 18/10; hoje há 286 casos de integração e 44 E2E catalogados.
- [ ] Reexecutar o Lighthouse se o cabeçalho público mudou desde a medição.

## Escopo novo na `main`

- [x] RF32 / PBI-48 (painel de indicadores e relatório de vendas) incluído na monografia: Tabelas 3.1, 4.1, 4.3 e 5.1, módulo `reports`, §3.3.2, §6.1 e §6.5, e diagrama de casos de uso (Fig. 4.3).
- [ ] Conferir com o grupo se a justificativa do RF32 na Tabela 3.1 reflete a decisão do grupo.

## Validação com o cliente

- [ ] (Recomendado, não exigido pela disciplina) Guardar um registro simples da sessão de 10/10/2026 com a Melanie Schwark (mensagem, foto ou anotação), para o caso de a banca perguntar.
- [ ] Registrar a sessão no PBI-47 do `Sprint-2.md`.
- [ ] Nome da Melanie na monografia: a disciplina não exige autorização, mas convém avisá-la (mensagem basta). Alternativa sem risco: citá-la só pela função ("a administradora e tatuadora do ateliê"). Se a UNIP exigir termo de consentimento para participantes, confirmar com a Profa. Elisa.

## Metodologia

- [x] §3.3 descreve a adaptação do Scrum: reuniões semanais às segundas-feiras; sem planejamento formal, diárias e retrospectiva sistemáticos.
- [x] Sprint 1 descrita como planejada para uma semana e executada de 08/09 a 03/10/2026; divergência discutida na §5.6.2.
- [ ] Combinar com o grupo uma explicação curta, para a banca, de por que o trabalho se concentrou perto das entregas (o histórico de commits do GitHub mostra isso).

## Acabamento (depois do texto fechado)

- [ ] **Sumário com páginas** (gerado no Word).
- [ ] **Lista de siglas**: completar só quando a versão final estiver fechada (SAQ-A, PBI, RF/RNF, entre outras que o texto usar).
- [ ] Numeração de páginas e de seções, margens, fonte e espaçamento ABNT.
- [ ] Contar as 40 páginas de texto no Word.
- [ ] Revisão de ortografia por quem não escreveu o capítulo.
- [ ] Regenerar o `.docx` a partir do `.md` final.
- [ ] Nome do arquivo com o número do grupo (`TCC2_Grupo_19_...`); envio por um integrante, pelo Teams.

## Projeto (depois da entrega; o texto já os trata como "projetado")

- [ ] PBI-46: VPS, Dockerfile, Compose de produção com Caddy e TLS, backup e restauração, compra real no sandbox.
- [ ] Pendências do PBI-45: navegação por teclado, envio real ao R2 (CORS), `heading-order` do catálogo.
