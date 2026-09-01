# Kolô — Ordem de execução das features

Checklist de construção. Cada item depende do que está acima. **P0** = defesa · **P1** = se der tempo.

Fonte: `ESCOPO-E-STACK.md` v2.1 · 51 features · 8 semanas.

---

## Fase 0 — Fundação (semana 1)

Infra primeiro, login depois. Postgres sobe no Docker; não instala na máquina.

### 0A — Contrato e ambiente (dias 1–2, antes de qualquer RF)

| # | ID | Item | P |
|---|----|------|---|
| A0 | SPEC | Revisão e aprovação do `ESCOPO-E-STACK.md` v2.1 pelos 5 integrantes; DER redesenhado na sequência | P0 |
| A1 | INFRA | Git/GitHub: `main` protegida, PR obrigatório, conventional commits | P0 |
| A2 | INFRA | Node 24 LTS + Docker Desktop em todas as máquinas; registrar em `package.json` (`engines`), `.nvmrc` e README | P0 |
| A3 | APP | `create-next-app` neste repo (Next 16, App Router, TypeScript, Tailwind) | P0 |
| A4 | INFRA | Docker Compose com PostgreSQL 17 | P0 |
| A5 | DADOS | `schema.prisma` completo a partir de `DER.md` (auth, acervo, pedido, agenda; sem `health_form`) | P0 |
| A6 | DADOS | Revisão humana do modelo: papéis, RN02/RN08/RN15, LGPD | P0 |
| A7 | INFRA | Migrate + seed: um `ADMIN`, um `CLIENTE`, um `ARTISTA` | P0 |
| A8 | UI | Identidade visual: paleta, tipografia, logo e tokens | P0 |
| A9 | UI | Layout base e design system (shadcn/ui) sobre os tokens da marca | P0 |

**Pronto 0A quando:** qualquer integrante clona, sobe o Compose e vê tabelas + seed. Ainda não precisa de tela de login.

Papéis no seed e no schema (fecha o RF07 no banco, sem tela): cadastro público sempre cria `CLIENTE`; `ARTISTA` nasce no admin (RF42) ou no seed; o primeiro `ADMIN` só existe via seed.

### 0B — Autenticação (dias 2–5)

| # | ID | Feature | P |
|---|----|---------|---|
| 1 | RF07 | Papéis Cliente / Artista / Admin (guarda de rota + Better Auth) | P0 |
| 2 | RF01 | Cadastro (nome, e-mail, telefone, senha) | P0 |
| 3 | RF02 | Login com sessão no banco, revogável | P0 |
| 4 | RF04 | Recuperação de senha por e-mail | P0 |
| 5 | RF05 | Edição de perfil | P0 |
| 6 | RF03 | Login com Google | P1 |

**Pronto 0B quando:** qualquer integrante sobe o ambiente, cadastra e entra.

---

## Fase 1 — Acervo (semana 2)

Artistas e obras existem antes de loja, agenda e 3D.

| # | ID | Feature | P |
|---|----|---------|---|
| 7 | RF42 | CRUD de artistas, estilos e tags | P0 |
| 8 | RF41 | Upload de imagens (tipo, tamanho, miniatura) | P0 |
| 9 | RF40 | CRUD de obras (ficha, preço, situação, destaque) | P0 |
| 10 | RF09 | Listagem pública de artistas | P0 |
| 11 | RF10 | Página do artista (obras + portfólio + agendar) | P0 |
| 12 | RF12 | Catálogo em grade (paginação, ordenação) | P0 |
| 13 | RF13 | Filtros (artista, técnica, faixa de preço, disponibilidade) | P0 |
| 14 | RF14 | Página da obra (fotos, ficha técnica; o 3D entra na fase 5) | P0 |
| 15 | RF08 | Home (destaques, chamada para o agendamento) | P0 |
| 16 | RF11 | Privacidade, termos e cancelamento | P0 |
| 17 | — | Busca textual no catálogo, tolerante a acento | P1 |
| 18 | — | Contato com antibot | P1 |
| 19 | RF45 | Configurações do site (contato, horários, textos institucionais, políticas) | P1 |

**Pronto quando:** admin cadastra uma obra e ela aparece no catálogo.

> Itens 17 e 18 não têm RF próprio na v2.1: a busca textual está implícita na seção 10 (índices em `artwork`) e o contato na visão do produto + `contact_message` + Turnstile. Se fizerem falta na defesa, viram RF46/RF47 no ESCOPO.
> O portfólio exibido na página do artista (item 11) é alimentado por seed até a fase 5.

---

## Fase 2 — Loja (semana 3)

| # | ID | Feature | P |
|---|----|---------|---|
| 20 | RF06 | Endereços de entrega | P0 |
| 21 | RF16 | Carrinho persistente | P0 |
| 22 | RF20 | Reserva temporária da obra no checkout | P0 |
| 23 | RF17 | Checkout (resumo, endereço, frete) | P0 |
| 24 | RF18 | Mercado Pago (Pix, cartão, boleto) | P0 |
| 25 | RF19 | Pedido confirmado só no webhook aprovado | P0 |
| 26 | RF21 | E-mail a cada status do pedido | P0 |
| 27 | RF22 | Acompanhamento e rastreio pelo cliente | P0 |
| 28 | RF43 | Gestão de pedidos no admin | P0 |
| 29 | RF17 | Frete (retirada / valor fixo / tabela) | P1 |
| 30 | RF43 | Cancelar pedido não pago; estorno no admin | P1 |

**Pronto quando:** compra sandbox fecha, obra fica vendida, e-mail chega.

---

## Fase 3 — Agenda (semana 4)

| # | ID | Feature | P |
|---|----|---------|---|
| 31 | RF29 | Disponibilidade semanal do artista | P0 |
| 32 | RF30 | Bloqueio de datas (férias, feriados) | P0 |
| 33 | RF28 | Só horários realmente livres | P0 |
| 34 | RF26 | Wizard (artista → estilo → região → tamanho → referências → horário → checks → confirmação) | P0 |
| 35 | RF27 | Upload de referências | P0 |
| 36 | RF31 | Solicitação → aprovação/recusa → confirmação | P0 |
| 37 | RF35 | Painel semanal do artista + pendentes | P0 |

**Pronto quando:** cliente solicita, artista aprova, não há horário duplicado.

---

## Fase 4 — Integrações da agenda + conferência presencial (semana 5)

| # | ID | Feature | P |
|---|----|---------|---|
| 38 | RF32 | Google Calendar (criar / atualizar / cancelar) | P0 |
| 39 | RF33 | Lembrete por e-mail | P0 |
| 40 | RF34 | Link `wa.me` com código do agendamento | P0 |
| 41 | RF38 | Check de maioridade + aviso de documento na sessão | P0 |
| 42 | RF37 | Check: termo de consentimento será assinado presencialmente | P0 |
| 43 | RF36 | Check: anamnese será preenchida presencialmente (sem dado de saúde no sistema) | P0 |

**Pronto quando:** agendamento confirmado aparece no Calendar e gera lembrete.

---

## Fase 5 — Portfólio e visualização 3D (semana 6)

Visualização 3D por último entre os P0 visuais: a ficha com fotos já cobre a banca se o 3D atrasar.

| # | ID | Feature | P |
|---|----|---------|---|
| 44 | RF23 | Portfólio de tatuagens com filtros | P0 |
| 45 | RF24 | Busca no portfólio | P0 |
| 46 | RF25 | Gestão do portfólio (admin e artista) | P0 |
| 47 | RF15 | Fallback 2D da ficha da obra (entregar **antes** do 3D) | P0 |
| 48 | RF14 | Visualizador 3D na ficha da obra (rotação e zoom) | P0 |

**Pronto quando:** a ficha da obra abre o modelo em 3D com rotação e zoom. Se o 3D falhar, a ficha com fotos (RF15) já vale.

---

## Fase 6 — Fechamento (semana 7)

| # | ID | Feature | P |
|---|----|---------|---|
| 49 | RF39 | Dashboard (faturamento, obras vendidas, agendamentos por status) | P0 |
| 50 | RF44 | Perfil unificado do cliente no admin | P1 |
| 51 | RN19 | LGPD: exclusão da própria conta com anonimização | P1 |

Em paralelo (não são RF, mas fecham a defesa): endurecer segurança, testes E2E, acessibilidade, Lighthouse.

---

## Fase 7 — Produção (semana 8)

Deploy na VPS, HTTPS, backup restaurado, validação com o cliente, roteiro da banca. Sem feature nova.

---

## Ordem de corte

Se o prazo apertar, pare de baixo para cima:

1. **P1 de loja/vitrine** — 6 (RF03), 17 (busca textual), 18 (contato), 29 (frete), 30 (estorno)
2. **P1 de admin/conta** — 19 (RF45), 50 (RF44), 51 (RN19)

**Não cortar:** Fases 0–4 P0 + fallback 2D (RF15) + visualizador 3D na ficha (RF14) + dashboard (RF39). Sem isso a tese não fecha.
