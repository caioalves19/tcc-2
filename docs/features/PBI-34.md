# PBI-34 — Agenda manual do artista e administrador

**Referências:** RF22; RN08, RN09 e RN10. **Prioridade:** P0. **Dependência:** PBI-16.

## Objetivo e contrato confirmado

O artista ou o admin cadastra o horário combinado com o cliente (no WhatsApp, depois do wizard do
PBI-31). Sem fila de pendentes e sem motor de horários livres (RF22). Decisões confirmadas com o
Robert antes de codar (09/10/2026):

- **Uma tela `/agenda`** para a equipe: o artista vê e opera só a própria agenda (RN10); o admin vê
  todas e filtra por artista. O cabeçalho mostra "Agenda" para ARTISTA e ADMIN.
- **Lista por semana** (segunda a domingo, horário de São Paulo), com "Semana anterior", "Esta
  semana" e "Próxima semana" na URL.
- **Editar, cancelar e concluir.** Cancelar libera o intervalo; nada é apagado.
- **Cliente opcional pelo e-mail:** o contato (nome e telefone) é obrigatório; um e-mail, se
  informado, liga o horário a uma conta ativa.
- **Sobreposição (RN08) pela constraint que já existia** (`appointment_no_overlap`), sem consulta
  prévia no código. Não houve migração.

Implementação no módulo `src/modules/scheduling` (`agenda.ts`, `agenda-leitura.ts` e
`agenda-regras.ts`), com API pública em `index.ts`. O gerador de código legível foi para
`src/lib/codigo.ts` e serve ao número do pedido (PBI-26) e ao código do horário.

## API pública (`src/modules/scheduling`)

| Função | Uso | Resultado |
|--------|-----|-----------|
| `lerAgenda(cabecalhos, { semana, artista })` | Página `/agenda` | `{ papel, artistaId, artistas, semana, dias (7), opcoes }` |
| `cadastrarHorario(entrada, cabecalhos)` | Action | `{ id, codigo }` |
| `editarHorario(entrada com id, cabecalhos)` | Action | `undefined` |
| `mudarSituacaoHorario({ id, situacao }, cabecalhos)` | Action | `undefined` |

Erros: `nao_autenticado`, `proibido`, `invalido` (com `campos`), `sobreposto`,
`cliente_inexistente`, `nao_encontrado`, `finalizado` e `falha`. O `finalizado` (horário já
cancelado ou concluído) entrou durante a implementação, porque nenhum dos outros descrevia o caso.

Regras puras (`agenda-regras.ts`): `deSaoPauloParaUtc`, `paraHorarioSaoPaulo`, `inicioDaSemana`,
`somarDias` e `codigoDoHorario`.

## Comportamentos

- **Autorização (RN10):** a cada pedido, o papel, a situação da conta e o vínculo com o artista são
  relidos no banco (como o `autorizarUpload` do PBI-17); a sessão só diz quem pede.
  - ARTISTA: cadastra, lê e altera só a própria agenda. Pedir a de outro (`artistaId` ou
    `?artista=`) é recusado no cadastro e ignorado na leitura; o horário de outro responde
    `nao_encontrado`, sem revelar que existe.
  - ADMIN: escolhe qualquer artista cadastrado e pode mudar o artista na edição.
  - CLIENTE, conta inativa ou excluída: `proibido`. Sem sessão: `nao_autenticado` (a página manda
    para `/login`).
- **Horários (RN09):** o formulário usa `datetime-local` no horário de São Paulo; o servidor grava
  UTC (fuso fixo −03:00, como no wizard do PBI-31, porque o Brasil não tem mais horário de verão).
  A semana vai de segunda 00:00 a domingo 23:59 em São Paulo, e um horário às 22:00 de segunda
  (já terça em UTC) aparece na segunda.
- **Validação:** nome e telefone com DDD (só dígitos, 10 ou 11) obrigatórios; fim depois do início
  e no máximo 12 horas; datas de 2020 a 2100; estilo e tamanho, se informados, precisam existir;
  e-mail, se informado, precisa ser de uma conta ativa (`cliente_inexistente`). Campo opcional
  vazio vindo do formulário (`""`) vale como não informado.
- **Sobreposição (RN08):** quem decide é a constraint `EXCLUDE ... tstzrange(inicio, fim, '[)')`,
  que ignora cancelados e excluídos. O adaptador do Prisma entrega o erro como `P2039`, com o
  `23P01` e o nome da constraint em `meta.driverAdapterError.cause`; o módulo traduz para
  `sobreposto`: "Este artista já tem um horário nesse intervalo." Horário encostado (fim = início
  do outro) passa.
- **Situação:** só `AGENDADO` muda. Editar, cancelar e concluir usam `updateMany` condicionado a
  `situacao = AGENDADO` (e, para o artista, ao `artist_id` dele): uma edição e um cancelamento
  simultâneos não passam os dois. `CANCELADO` e `CONCLUIDO` são finais (`finalizado`).
- **Código:** `AG-AAAAMMDD-XXXXXX`; não muda na edição.
- **Tela `/agenda`:**
  - "Semana de 12/10 a 18/10/2026", navegação de semanas e, para o admin, o filtro "Artista" (o
    filtro segue nos links);
  - os 7 dias ("Segunda, 12/10" … "Domingo, 18/10"), com "Sem horários" quando vazio;
  - cada horário: início–fim, situação, código, contato com link `tel:`, e-mail ligado, estilo,
    tamanho, região, observações e, para o admin, o artista;
  - "Novo horário" e "Editar" abrem o formulário (o artista não escolhe artista); erros aparecem no
    campo e as recusas (sobreposição, cliente inexistente) em alerta;
  - "Editar", "Concluir" e "Cancelar" só em horário agendado.

## Limites conhecidos

- **Fuso fixo −03:00.** Se o horário de verão voltar, a conversão precisa usar a base de fusos.
- **E-mail do cliente:** a equipe consegue saber se um e-mail tem conta ativa. É restrito a ARTISTA
  e ADMIN, e o vínculo é opcional.
- **Sem confirmação ao cancelar ou concluir:** a ação é imediata (e final).
- **Sem limitação de taxa:** a agenda não está na lista do RNF08 e exige login da equipe.
- **Sessões que atravessam a meia-noite** aparecem no dia em que começam.

## Validação

Seams: `cadastrarHorario`, `editarHorario`, `mudarSituacaoHorario`, `lerAgenda` e as regras
puras; os componentes `FormularioHorario` e `AgendaSemana`; a página `/agenda`, as actions e o
cabeçalho.

- `npm run test:integration -- tests/integration/agenda` (PostgreSQL real, 11 testes):
  - cadastro do artista gravado em UTC (14:00 em São Paulo → 17:00 UTC), com código e opcionais;
  - sobreposto recusado; encostado e de outro artista aceitos;
  - 5 cadastros simultâneos no mesmo intervalo, em 3 rodadas: só um passa;
  - RN10: artista não cadastra para outro; cliente e visitante recusados; admin escolhe artista
    (obrigatório e cadastrado); artista rebaixado a cliente perde o acesso na hora;
  - validações por campo e e-mail opcional (sem conta: recusado; com conta: ligado);
  - editar respeita a sobreposição; cancelar libera o intervalo; finalizado não muda;
  - outro artista não altera nem descobre o horário; admin altera e troca o artista;
  - semana por dia de São Paulo (bordas de domingo e da virada UTC), artista só com os dele, admin
    com todos e filtro, cliente e visitante recusados.
- `npm run test:unit -- agenda-regras formulario-horario agenda-semana pagina-agenda agenda-acoes
  cabecalho checkout-regras`: fuso, semana e código; formulário; lista da semana; página; actions;
  link no cabeçalho; e o número do pedido segue igual depois de ir para `src/lib/codigo.ts`.
- **No navegador** (09/10/2026, Postgres local, sessão de ADMIN, acompanhado pelo Robert):
  - sem sessão, `/agenda` leva ao `/login`; logado, o cabeçalho mostra "Agenda";
  - cadastro de quarta 14:00–17:00 aparece no dia certo e fica gravado como 17:00–20:00 UTC;
  - 16:00–18:00 no mesmo dia é recusado com "Este artista já tem um horário nesse intervalo.", e o
    formulário continua aberto com os dados;
  - 17:00–18:00 (encostado) é aceito; a edição para 17:00–19:00 mantém o código;
  - concluir e cancelar mudam a situação e tiram os botões;
  - o filtro de artista vai para a URL e segue em "Semana anterior/Esta semana/Próxima semana";
  - sem rolagem horizontal em 375 e 320 px, também com o formulário aberto.

## Pendências

- **Página do artista:** não existe área pública do artista; a agenda é só interna.
- **Conferência com sessão de ARTISTA:** a do navegador foi feita como ADMIN; a restrição do
  artista à própria agenda está coberta pelos testes de integração (RN10).
