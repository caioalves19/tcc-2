# PBI-33 — Conclusão pelo WhatsApp e integração da home

**Referências:** RF21; conclusão do RF07; apoio RN01, RNF18. **Dependências:** PBI-21, PBI-31 e
PBI-32.

## Objetivo e contrato confirmado

O wizard de `/agendamento` termina numa etapa 8, "WhatsApp", com a mensagem pronta para o estúdio,
e a home passa a levar a ele. Decisões confirmadas com o Robert antes de codar (13/10/2026):

- **O servidor monta a mensagem e o link,** na mesma revisão que já valida tudo (PBI-31/32). Os
  nomes de artista, estilo e tamanho vêm do banco, não do navegador.
- **Número do estúdio em `CONTATO`** (`src/lib/contato.ts`), o mesmo do rodapé e da home. O PBI-39
  leva para as configurações do site.
- **Etapa 8 como no Stitch** (`docs/telas/tattoo/wizard-8-whatsapp-*`): resumo, prévia exata da
  mensagem, nota de que as fotos de referência vão na conversa, "Abrir conversa no WhatsApp" e
  "Editar preferências". A barra de etapas passa a 8 itens.
- **Home:** o "Agendar tatuagem" do topo e o botão do bloco de tatuagem levam a `/agendamento`; os
  passos do bloco viram os do Stitch (escolha artista e estilo, diga quando prefere, finalize no
  WhatsApp), com o aviso de anamnese e termo presenciais.
- **Fora:** gravar solicitação ou agendamento; abrir o WhatsApp sozinho (`window.open` ou
  redirecionamento); API oficial do WhatsApp; número por artista; configuração do número fora do
  código (PBI-39); links "Editar" por linha do resumo.

## Mensagem

`mensagemAgendamento(conteudo)`, função pura em `src/modules/scheduling/whatsapp.ts`:

```text
Olá! Sou {nome} e quero agendar uma tatuagem com {artista}.
Estilo: {estilo}
Região do corpo: {região}
Tamanho: {tamanho}
Preferência: {DD/MM/AAAA} às {HH:MM} (horário de São Paulo)
Li e aceito os avisos: anamnese e termo de consentimento presenciais e declaração de maioridade.
```

O tipo exige os três aceites como `true`: a função só é chamada depois da validação do PBI-32.

## API pública (`src/modules/scheduling`)

`validarDadosWizard` e a Server Action `revisarPreferenciaWizard` devolvem, além do que já
devolviam (dados validados e `preferenciaEm`):

- `mensagem`: o texto acima, com os nomes lidos do banco;
- `linkWhatsApp`: `linkWhatsApp(mensagem)` do `src/lib/contato.ts`, ou seja,
  `https://wa.me/<número do estúdio>?text=<mensagem codificada>`.

O texto do cliente (nome, região) entra só codificado no parâmetro `text`: o destino do link não
muda.

## Comportamentos

- **Etapa 8:** o título "Revise suas preferências" continua; a barra marca "8. WhatsApp" como
  atual. A prévia mostra a mensagem com as quebras de linha. O link abre em nova aba
  (`noopener noreferrer`) e só com o clique da pessoa. "Editar preferências" volta às etapas com os
  dados e os aceites mantidos.
- **Nada é gravado** ao revisar nem ao abrir o link (RN01, RNF18).
- **Home:** duas chamadas "Agendar tatuagem" (topo e bloco), ambas para `/agendamento`; nenhum
  link `wa.me` no bloco de tatuagem. A faixa de murais continua com o WhatsApp direto.

## Validação

- `npm run test:unit -- mensagem-agendamento wizard-validacao`: texto exato da mensagem; a revisão
  devolve mensagem e link, com acento, `&`, `/` e quebras de linha codificados e o texto voltando
  intacto pela URL.
- `npm run test:integration -- tests/integration/wizard-agendamento` (PostgreSQL real): a revisão
  devolve a mensagem com os nomes do banco e o link do estúdio, e `appointment` continua vazia.
- `npm run test:unit -- wizard-whatsapp wizard-agendamento wizard-avisos`: etapa 8 com 8 etapas na
  barra, prévia exata, link com `target` e `rel`; nada abre sozinho (`window.open` não é chamado);
  os fluxos dos PBIs 31 e 32 terminam no link.
- `npm run test:unit -- pagina-home links-internos`: as duas chamadas levam a `/agendamento`, os
  três passos novos, o aviso de anamnese e termo, nenhum `wa.me` no bloco; todo link interno tem
  página.
- **Revisão de código e de segurança:** mensagem montada só depois da validação, nomes do banco,
  destino fixo do link, limite de tentativas mantido, política de privacidade já coerente ("o site
  só monta a mensagem e abre a conversa no WhatsApp").

## Pendências para os próximos PBIs

- **PBI-39:** levar o número do WhatsApp e os textos da home para as configurações do site.
