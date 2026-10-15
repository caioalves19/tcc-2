# PBI-39 — Configurações do site

**Referências:** RF31; apoio RNF17. **Dependências:** PBI-21, PBI-22 e PBI-33 (feito sobre a branch
do PBI-33, PR #64, porque o link do wizard muda aqui).

## Objetivo e contrato confirmado

O ADMIN edita em `/admin/configuracoes` o contato, os horários e os textos institucionais, e o site
inteiro passa a usá-los. Decisões confirmadas com o Robert antes de codar (13/10/2026):

- **Contato:** e-mail, WhatsApp e os perfis de Instagram do ateliê e do tattoo.
- **Horários:** texto livre, até 4 linhas curtas, no rodapé e na página de contato. Sem horário
  salvo, a seção não aparece.
- **Textos institucionais:** apresentação do topo da home, frase do bloco de tatuagem, texto da
  faixa de murais e frase do rodapé. Títulos e rótulos de botões continuam no código.
- **Políticas: desvio do card, registrado aqui.** O card cita "políticas" entre o que o ADMIN edita.
  O texto das três políticas continua no código: é texto jurídico revisado pela equipe, com testes
  que garantem os itens obrigatórios (o inventário de dados do RNF17, por exemplo). Se o ADMIN
  editasse o texto inteiro, poderia apagar uma cláusula obrigatória e os testes deixariam de valer
  para o que está no ar. O que as políticas citam de contato (e-mail e WhatsApp) vem das
  configurações.
- **Frete fica de fora:** o PBI-42 deixou em aberto editar o valor de São Paulo e a tabela por UF.
  O RF31 não cita frete, e mexer no cálculo do checkout perto do prazo é arriscado. Fica como
  pendência para a equipe.
- **Fora:** horário estruturado por dia, editor rico ou HTML, migração (a tabela `site_setting` já
  existia desde a Sprint 1).

## Dados

Tabela `site_setting` (`chave`, `valor` JSON), uma linha por chave:

| Chave | Valor | Padrão (sem nada salvo) |
|-------|-------|-------------------------|
| `contato` | `{ email, whatsapp, instagramAtelie, instagramTattoo }` | `ateliekolo@gmail.com`, `5511950901191`, `koloatelie`, `kolotattoo` |
| `horarios` | lista de até 4 linhas | vazia (seção escondida) |
| `textos` | `{ apresentacao, tatuagem, murais, rodape }` | os textos de antes do PBI-39 |

## Regras (`src/modules/settings/configuracao.ts`)

- **E-mail:** sem espaços nas pontas, minúsculas, formato válido, até 254 caracteres.
- **WhatsApp:** só os dígitos ficam ("+55 (11) 91234-5678" vira `5511912345678`); exige 55, DDD e
  número (12 ou 13 dígitos).
- **Instagram:** sem o `@`, minúsculas, até 30 letras, números, ponto ou sublinhado.
- **Horários:** o formulário manda um texto; vira uma linha por item, sem linhas vazias, até 4
  linhas de até 60 caracteres.
- **Textos:** de 10 caracteres até 400 (apresentação e murais), 200 (tatuagem) e 160 (rodapé),
  sem `<` nem `>`.
- Campos a mais são recusados. A entrada inteira é validada antes de gravar qualquer chave.
- **Leitura:** cada chave salva substitui o padrão só se ainda for válida; um valor corrompido
  volta ao padrão só naquela chave.

## API pública (`src/modules/settings`)

| Função | Uso | Resultado |
|--------|-----|-----------|
| `lerConfiguracao()` | Layout, home, contato, obra, políticas e revisão do wizard | `ConfiguracaoSite`; sem login; se o banco falhar, os padrões |
| `salvarConfiguracao(entrada, cabecalhos)` | Server Action do admin | Pelo `comoAdmin`; `{ ok, dados }` normalizados ou `nao_autenticado`, `proibido`, `invalido` |
| `PADRAO`, `schemaEntradaConfiguracao` | Testes e telas | Valores padrão e validação |

Links em `src/lib/contato.ts`: `hrefWhatsApp(numero)`, `linkWhatsApp(mensagem, numero)` e
`hrefInstagram(perfil)`. A constante `CONTATO` saiu: nada mais tem contato fixo no código.

## Onde cada valor aparece

- **Rodapé** (pelo layout): e-mail, WhatsApp, os dois Instagram, horários e a frase.
- **Home:** apresentação, frase do bloco de tatuagem, texto dos murais e o WhatsApp da faixa de
  murais.
- **Contato:** "Horários de atendimento".
- **Página da obra:** o WhatsApp de "Tirar dúvidas com o ateliê".
- **Políticas:** o e-mail e o WhatsApp citados no texto e o quadro "Dúvidas?".
- **Wizard (PBI-33):** a validação monta a mensagem; a revisão acrescenta o link com o WhatsApp
  salvo.
- **Admin:** "Configurações" no menu; salvar atualiza o site inteiro (`revalidatePath("/",
  "layout")`). Depois de salvar, os campos mostram o valor como ficou gravado.

## Validação

- `npm run test:unit -- configuracao-site configuracao-falha-banco link-whatsapp rodape pagina-home pagina-contato detalhe-obra pagina-obra paginas-politicas documento-politica formulario-configuracoes paginas-admin-configuracoes admin-layout wizard-validacao`:
  normalização e recusas (inclusive HTML e campo a mais), padrão e chave corrompida, banco fora do
  ar, links, cada página com o valor configurado, formulário (valores atuais, envio, erro, campos
  atualizados depois de salvar), página, action e menu.
- `npm run test:integration -- tests/integration/configuracao-site tests/integration/wizard-agendamento`
  (PostgreSQL real): padrão sem nada salvo; ADMIN salva e o valor normalizado fica no banco (sem
  duplicar linhas); visitante, cliente e artista recusados e entrada inválida sem gravar nada;
  valor corrompido volta ao padrão só na chave; o link do wizard usa o WhatsApp salvo.
- **No navegador** (13/10/2026, Postgres local, logado como `admin@kolo.test`, com um estilo
  temporário para o wizard; configurações e estilo apagados depois):
  - WhatsApp inválido mostrou o erro sem salvar;
  - depois de salvar: rodapé, home, faixa de murais, contato, política de privacidade (o e-mail
    antigo sumiu) e o link do wizard com os valores novos;
  - axe-core sem violações na tela do admin em 1280 e 375 px, sem rolagem horizontal, console sem
    erros.
  - A conferência achou o campo do WhatsApp mostrando o texto digitado em vez do valor gravado;
    corrigido (os campos são recriados com o valor salvo e o aviso continua).
- **Revisão de código e de segurança:** só o ADMIN salva (relido no banco); entrada validada
  inteira antes de gravar; formatos fechados para e-mail, WhatsApp e Instagram, então não dá para
  montar link para outro site; textos sem `<` e `>`; leitura pública só do que já é público.

## Pendências

- **Equipe:** decidir se o frete (valor de São Paulo e tabela por UF, PBI-42) ganha tela no admin.
- **Equipe:** o desvio sobre as políticas (texto no código) precisa do aceite do grupo.
