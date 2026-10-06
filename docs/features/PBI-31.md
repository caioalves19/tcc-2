# PBI-31 — Wizard público de agendamento

**Referências:** RF20, RN01, RNF08, RNF09 e RNF18. **Dependência:** PBI-16.

## Objetivo e contrato confirmado

Disponibilizar `/agendamento`, sem autenticação, com seis etapas: nome, artista, estilo, região do corpo, tamanho e preferência de data/horário. O visitante pode voltar sem perder os dados e revisar suas preferências ao final.

Implementação com Next.js, React, Zod, Prisma e PostgreSQL existentes. APIs públicas em `src/modules/artists/index.ts` e `src/modules/scheduling/index.ts`; a página e a Server Action consomem essas APIs. O componente recebe opções e uma ação de revisão, sem importar código de banco para o navegador.

Não criar solicitações nem agendamentos, consultar disponibilidade, coletar imagens ou dados clínicos. Aceites de conformidade ficam no PBI-32; WhatsApp e chamada da home ficam no PBI-33. A conclusão permanece desabilitada.

## Comportamentos

- Artistas somente com conta ARTISTA ativa, não excluída; retornar apenas nome, ID do perfil e estilos vinculados, sem dados privados da conta.
- Tamanhos vindos de `SizeTier`, ordenados por `order`. `npm run db:seed` inicializa Pequena, Média e Grande quando a tabela está vazia, preservando catálogos existentes e sem definir faixas em centímetros.
- Alterar artista limpa o estilo anterior. Artista sem estilos oferece orientação para voltar; ausência de artistas ou tamanhos exibe estado vazio.
- O navegador mantém os dados apenas no estado do formulário. A revisão no servidor valida formato, limites de texto, data, horário e vínculos consultados novamente no banco.
- Preferência deve estar no futuro, interpretada no horário de São Paulo (UTC-03) e retornada em UTC; representa uma preferência, não um horário confirmado.
- Consulta de opções e revisão compartilham limite de 60 requisições por IP em 10 minutos, usando contador atômico existente e chave com hash do IP. Avançar e voltar nas etapas locais não consomem tentativas.
- Revisão em andamento desabilita os campos e botões; falhas preservam os dados e permitem correção ou nova tentativa.
- Campos rotulados, erro anunciado, foco no campo inválido ou título da etapa, navegação com teclado e layout que se adapta à largura disponível.

## Validação

Seams confirmados: funções públicas de validação e consulta de opções, revisão no servidor e navegação do formulário.

- `npm run test:unit -- tests/unit/wizard-validacao.test.ts`: dados válidos, campos extras, opções inexistentes, datas impossíveis ou passadas, horários inválidos e conversão para UTC.
- `npm run test:unit -- tests/unit/wizard-agendamento.test.tsx`: seis etapas, voltar, mudança de artista, estados vazios, teclado, foco, resumo bloqueado e falha durante revisão.
- `npm run test:integration -- tests/integration/wizard-agendamento.test.ts`: PostgreSQL real, projeção pública, vínculos alterados, ausência de escrita na agenda, limite de requisições e seed repetido.
- Gates gerais: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:integration` e `npm run build -- --webpack`.

O build foi validado com Webpack. `test:e2e` continua sendo o placeholder existente; não foi considerado evidência de E2E. A ferramenta de navegador recusou conexão com a prévia local, portanto a conferência visual em 320, 768, 1440 e 1920 px permanece pendente, assim como o aceite humano e a aprovação do PR.
