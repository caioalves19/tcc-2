# Kolô — Briefing de produto (TCC 2)

Plataforma web para o **Kolô Ateliê & Estúdio**: catálogo e venda de obras de arte (ficha em 2D) e agendamento de tatuagens via wizard → WhatsApp. Entrega acadêmica em **8 semanas**, com uso real pelo cliente como bônus. Detalhamento em `ESCOPO-E-STACK.md` v2.2.

---

## Features propostas

| Frente | O que entra |
|--------|-------------|
| **Vitrine** | Home, catálogo de obras em grade 2D, ficha da obra (fotos + ficha técnica), portfólio de tatuagens, políticas e contato. Sem páginas públicas de artista. |
| **E-commerce** | Carrinho persistente, um endereço, checkout, Mercado Pago (Pix/cartão/boleto), reserva de 10 min, estoque padrão 1 (editável), rastreio. Sem e-mail de pedido. |
| **Agendamento** | Wizard público (nome → artista → estilo → região → tamanho → data/horário preferido → checks) abre `wa.me` com os dados. Referências o cliente manda no Zap. Artista/admin cadastra o horário depois. Sem slots, aprovação, Calendar ou lembrete. |
| **Conformidade** | Checks no wizard só para liberar o WhatsApp (anamnese, termo, maioridade). LGPD básico, sem dado de saúde e sem conferência de staff no sistema. |
| **Back-office** | CRUD de obras/artistas/portfólio, pedidos, cadastro manual de agenda, papéis Cliente / Artista / Admin. Sem dashboard. |

**Não entra agora** (adiado na v2.2, pode voltar): visualizador 3D, login Google, páginas de artista, filtros do catálogo, e-mail transacional de pedido, motor de horários, Google Calendar, lembrete, dashboard, vários endereços, “meus agendamentos”.

**Não entra** (já fora na v2.1): sala virtual navegável, tour 360°, chatbot com IA, API oficial de WhatsApp, marketplace com split, app nativo, NF-e, ficha de anamnese digital nem armazenamento de dado de saúde.

---

## Stack

Uma aplicação TypeScript full-stack (monolito modular), Docker na VPS.

| Camada | Tecnologia |
|--------|------------|
| App | **Next.js 16** (App Router) + **React 19** + TypeScript + Tailwind 4 + shadcn/ui |
| Dados | **PostgreSQL 17** + **Prisma 7** |
| Auth | **Better Auth** (e-mail/senha) |
| Pagamento | **Mercado Pago Checkout Pro** (webhook assinado) |
| Mídia / e-mail / WhatsApp | Cloudflare R2 · Resend (recuperação de senha) · deep links `wa.me` |
| Qualidade | Vitest + Playwright |
| Deploy | Docker Compose + **Caddy** (HTTPS) na VPS |
