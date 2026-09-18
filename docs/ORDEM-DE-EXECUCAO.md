# Kolô — Ordem de execução das features

Checklist de construção. Cada item depende do que está acima. **P0** = defesa · **P1** = se der tempo.

Fonte: `ESCOPO-E-STACK.md` v2.2 · RF01–RF31 · 8 semanas.

---

## Fase 0 — Fundação (semana 1)

Infra primeiro, login depois. Postgres sobe no Docker; não instala na máquina.

### 0A — Contrato e ambiente (dias 1–2, antes de qualquer RF)

| # | ID | Item | P |
|---|----|------|---|
| A0 | SPEC | Revisão e aprovação do `ESCOPO-E-STACK.md` v2.2 pelos 5 integrantes; DER redesenhado na sequência | P0 |
| A1 | INFRA | Git/GitHub: `main` protegida, PR obrigatório, conventional commits | P0 |
| A2 | INFRA | Node 24 LTS + Docker Desktop em todas as máquinas; registrar em `package.json` (`engines`), `.nvmrc` e README | P0 |
| A3 | APP | `create-next-app` neste repo (Next 16, App Router, TypeScript, Tailwind) | P0 |
| A4 | INFRA | Docker Compose com PostgreSQL 17 | P0 |
| A5 | DADOS | `schema.prisma` completo a partir de `DER.md` (auth, acervo, pedido, agenda manual; sem `health_form`, slots, 3D) | P0 |
| A6 | DADOS | Revisão humana do modelo: papéis, RN02/RN08/RN09, LGPD (RN12) | P0 |
| A7 | INFRA | Migrate + seed: um `ADMIN`, um `CLIENTE`, um `ARTISTA` | P0 |
| A8 | UI | Identidade visual: paleta, tipografia, logo e tokens | P0 |
| A9 | UI | Layout base e design system (shadcn/ui) sobre os tokens da marca | P0 |

**Pronto 0A quando:** qualquer integrante clona, sobe o Compose e vê tabelas + seed. Ainda não precisa de tela de login.

Papéis no seed e no schema (fecha o RF06 no banco, sem tela): cadastro público sempre cria `CLIENTE`; `ARTISTA` nasce no admin (RF28) ou no seed; o primeiro `ADMIN` só existe via seed.

### 0B — Autenticação (dias 2–5)

| # | ID | Feature | P |
|---|----|---------|---|
| 1 | RF06 | Papéis Cliente / Artista / Admin (guarda de rota + Better Auth) | P0 |
| 2 | RF01 | Cadastro (nome, e-mail, telefone, senha) | P0 |
| 3 | RF02 | Login com sessão no banco, revogável | P0 |
| 4 | RF03 | Recuperação de senha por e-mail | P0 |
| 5 | RF04 | Edição de perfil | P0 |

**Pronto 0B quando:** qualquer integrante sobe o ambiente, cadastra e entra. Sem login social.

---

## Fase 1 — Acervo (semana 2)

Artistas e obras existem antes de loja e agenda. Sem páginas públicas de artista e sem 3D.

| # | ID | Feature | P |
|---|----|---------|---|
| 6 | RF28 | CRUD de artistas, estilos e tags | P0 |
| 7 | RF27 | Upload de imagens (tipo, tamanho, miniatura) | P0 |
| 8 | RF26 | CRUD de obras (ficha, preço, estoque, situação, destaque) | P0 |
| 9 | RF09 | Catálogo em grade (paginação, ordenação) | P0 |
| 10 | RF10 | Página da obra (fotos e ficha técnica) | P0 |
| 11 | RF07 | Home (destaques, chamada para o agendamento) | P0 |
| 12 | RF08 | Privacidade, termos e cancelamento | P0 |
| 13 | — | Busca textual no catálogo, tolerante a acento | P1 |
| 14 | — | Contato com antibot | P1 |
| 15 | RF31 | Configurações do site (contato, horários, textos institucionais, políticas) | P1 |

**Pronto quando:** admin cadastra uma obra e ela aparece no catálogo.

> Itens 13 e 14 não têm RF próprio na v2.2: a busca textual está implícita na seção 10 (índices em `artwork`) e o contato na visão do produto + `contact_message` + Turnstile.

---

## Fase 2 — Loja (semana 3)

| # | ID | Feature | P |
|---|----|---------|---|
| 16 | RF05 | Um endereço de entrega | P0 |
| 17 | RF11 | Carrinho persistente | P0 |
| 18 | RF15 | Reserva temporária das unidades no checkout (10 min) | P0 |
| 19 | RF12 | Checkout (resumo, endereço, frete) | P0 |
| 20 | RF13 | Mercado Pago (Pix, cartão, boleto) | P0 |
| 21 | RF14 | Pedido confirmado só no webhook aprovado | P0 |
| 22 | RF16 | Acompanhamento e rastreio pelo cliente | P0 |
| 23 | RF29 | Gestão de pedidos no admin | P0 |
| 24 | RF12 | Frete (retirada / valor fixo / tabela) | P1 |
| 25 | RF29 | Cancelar pedido não pago; estorno no admin | P1 |

**Pronto quando:** compra sandbox fecha e o estoque da obra é baixado. Sem e-mail de pedido.

---

## Fase 3 — Agenda (semana 4)

Wizard público → WhatsApp. O tatuador cadastra o horário depois. Sem motor de slots, Calendar ou lembrete.

| # | ID | Feature | P |
|---|----|---------|---|
| 26 | RF20 | Wizard público: nome → artista → estilo → região → tamanho → data/horário (preferência) → checks | P0 |
| 27 | RF23–RF25 | Checks obrigatórios (anamnese, termo, maioridade) para liberar o link | P0 |
| 28 | RF21 | Redirect `wa.me` com a mensagem pré-preenchida | P0 |
| 29 | RF22 | Cadastro manual de horário pelo artista/admin (RN08) | P0 |

**Pronto quando:** o visitante termina o wizard e abre o Zap com os dados; o artista grava um horário sem sobrepor outro.

---

## Fase 4 — Portfólio (semana 5)

| # | ID | Feature | P |
|---|----|---------|---|
| 30 | RF17 | Portfólio de tatuagens com filtros | P0 |
| 31 | RF18 | Busca no portfólio | P0 |
| 32 | RF19 | Gestão do portfólio (admin e artista) | P0 |

**Pronto quando:** a galeria pública lista trabalhos e o artista/admin consegue incluir, editar e remover fotos.

---

## Fase 5 — Fechamento (semanas 6–7)

Sem dashboard. Semana extra aproveitada para qualidade da defesa.

| # | ID | Feature | P |
|---|----|---------|---|
| 33 | RF30 | Perfil unificado do cliente no admin | P1 |
| 34 | RN12 | LGPD: exclusão da própria conta com anonimização | P1 |

Em paralelo (não são RF, mas fecham a defesa): endurecer segurança, testes E2E (compra sandbox + wizard até `wa.me`), acessibilidade, Lighthouse.

---

## Fase 6 — Produção (semana 8)

Deploy na VPS, HTTPS, backup restaurado, validação com o cliente, roteiro da banca. Sem feature nova.

---

## Ordem de corte

Se o prazo apertar, pare de baixo para cima:

1. **P1 de loja/vitrine** — 13 (busca textual), 14 (contato), 24 (frete), 25 (estorno)
2. **P1 de admin/conta** — 15 (RF31), 33 (RF30), 34 (RN12)

**Não cortar:** Fases 0–4 P0 (auth, acervo 2D, loja, wizard → WhatsApp + cadastro manual, portfólio). Sem isso a tese não fecha.
