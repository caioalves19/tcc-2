# PBI-32 — Checks obrigatórios de conformidade

**Referências:** RF23, RF24, RF25 e RNF18. **Prioridade:** P0. **Dependência:** PBI-31.

## Objetivo e contrato confirmado

O wizard de `/agendamento` ganha a etapa 7, "Avisos", depois da Preferência e antes da revisão,
com três aceites obrigatórios. Decisões confirmadas antes de codar (11/10/2026):

- **Etapa própria** (tela `docs/telas/tattoo/wizard-7-avisos-*`), e não dentro da revisão. A barra
  de etapas passa de 6 para 7 itens.
- **Interface e servidor:** a revisão no servidor também exige os três aceites. A ESCOPO trata os
  checks como condição de interface; validar de novo no servidor só impede montar a mensagem do
  PBI-33 sem eles. Nada é gravado.
- **Bloqueio por erro e foco**, no mesmo padrão das etapas 1–6: o botão continua ativo e, sem algum
  aceite, a mensagem aparece com `role="alert"` e o foco vai para o primeiro aviso desmarcado.
  Escolhido em vez do botão desabilitado da tela por acessibilidade.
- **Textos da tela**, com o aviso de que o horário pode ser cancelado. É só aviso: o software não
  aplica cancelamento (política de cancelamento pelo software está adiada na v2.2).

## Avisos

| Chave | Texto |
|-------|-------|
| `anamnese` (RF23) | A ficha de anamnese será preenchida presencialmente. Se não comparecer para preenchê-la, o horário pode ser cancelado. |
| `termo` (RF24) | O termo de consentimento será assinado presencialmente. Sem a assinatura, o horário pode ser cancelado. |
| `maioridade` (RF25) | Declaro ter 18 anos ou mais. Meu documento com foto será conferido no estúdio; sem ele, o horário será cancelado. |

## API pública (`src/modules/scheduling`)

- `validarDadosWizard` e `revisarPreferenciaWizard` exigem
  `aceites: { anamnese: true, termo: true, maioridade: true }`. Aceite ausente, `false`, de outro
  tipo ou campo extra dentro de `aceites` devolve `{ ok: false, mensagem: "Confirme os três avisos
  para continuar." }`.
- `PreferenciaWizard` passa a levar os `aceites` validados: é de onde o PBI-33 lê o que vai na
  mensagem do WhatsApp (RF21).
- Novo tipo `EntradaWizard`: o estado do formulário, com os aceites booleanos e desmarcados no
  início. O componente recebe `revisar: (entrada: EntradaWizard) => …`.

## Comportamentos

- Os aceites ficam só no estado do formulário. Voltar, avançar e "Editar preferências" mantêm as
  marcações; desmarcar um aviso volta a bloquear.
- Só os avisos desmarcados ficam `aria-invalid` depois do erro. Cada checkbox tem rótulo próprio (o
  texto do aviso); o ícone é decorativo (`aria-hidden`).
- O botão final da revisão ("Continuar para confirmação") continua desabilitado: o `wa.me` e a
  chamada da home são do PBI-33.
- RNF18: sem migração, sem mudança no `schema.prisma` e sem escrita no banco ao revisar.

## Validação

Seams: `validarDadosWizard`, `revisarPreferenciaWizard` (Server Action) e `WizardAgendamento`.

- `npm run test:unit -- tests/unit/wizard-validacao.test.ts`: aceite ausente, falso, de outro tipo
  ou com campo extra recusado com a mensagem; os três `true` passam e voltam na preferência.
- `npm run test:unit -- tests/unit/wizard-avisos.test.tsx`: etapa 7 com os três avisos desmarcados;
  para cada aceite faltando, a revisão não é chamada, o erro aparece e o foco vai para ele; os
  aceites chegam à revisão e sobrevivem a voltar, editar e desmarcar.
- `npm run test:unit -- tests/unit/wizard-agendamento.test.tsx`: os fluxos do PBI-31 passam pela
  etapa 7.
- `npm run test:integration -- tests/integration/wizard-agendamento.test.ts`: PostgreSQL real; sem
  os aceites a Server Action recusa e `appointment` continua vazia.

Evidências (11/10/2026): `npm run lint` e `npm run typecheck` sem erros; `npm test` com 83 arquivos
e 370 testes; `npm run test:integration` com 26 arquivos e 153 testes; `npm run build -- --webpack`
concluído. No navegador (`next dev`, banco local com um estilo temporário ligado ao artista do seed
e removido depois): revisar sem aceites mostrou o alerta, levou o foco ao aviso de anamnese e marcou
os três como inválidos; com os três marcados, o servidor devolveu a revisão; em 320 px os avisos
quebram linha sem rolagem horizontal e as marcações continuam depois de "Editar preferências".

Os testes novos de interface ficam em `wizard-avisos.test.tsx`, separado de
`wizard-agendamento.test.tsx`, para não colidir com a PR #49, que só acrescenta o
`vi.setConfig` no topo daquele arquivo.
