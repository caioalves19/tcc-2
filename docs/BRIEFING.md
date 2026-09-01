# Kolô — Briefing de produto (TCC 2)

Plataforma web para o **Kolô Ateliê & Estúdio**: catálogo e venda de obras de arte, visualização interativa em 3D das obras e agendamento de tatuagens. Entrega acadêmica em **8 semanas**, com uso real pelo cliente como bônus. Detalhamento em `ESCOPO-E-STACK.md`.

---

## Features propostas

| Frente | O que entra |
|--------|-------------|
| **Vitrine** | Home, artistas, catálogo de obras em grade 2D, portfólio de tatuagens, políticas e contato |
| **Visualização 3D** | Visualizador interativo na ficha de cada obra (rotação e zoom); catálogo permanece em grade 2D; fallback para fotos 2D quando o dispositivo não suportar WebGL |
| **E-commerce** | Carrinho, checkout, Mercado Pago (Pix/cartão/boleto), reserva da peça única, e-mail de status, rastreio |
| **Agendamento** | Wizard (artista → estilo → tamanho → referências → horário); horários reais; aprovação do artista; Google Calendar; lembrete por e-mail; WhatsApp só como link `wa.me` |
| **Conformidade** | Alertas e checks de anamnese, termo e maioridade (conferência presencial); LGPD básico, sem dado de saúde |
| **Back-office** | CRUD de obras/artistas/portfólio, pedidos, agenda, dashboard, papéis Cliente / Artista / Admin |

**Não entra:** sala virtual navegável, tour 360°, chatbot com IA, API oficial de WhatsApp, marketplace com split, app nativo, NF-e, ficha de anamnese digital nem armazenamento de dado de saúde.

---

## Stack

Uma aplicação TypeScript full-stack (monolito modular), Docker na VPS.

| Camada | Tecnologia |
|--------|------------|
| App | **Next.js 16** (App Router) + **React 19** + TypeScript + Tailwind 4 + shadcn/ui |
| 3D | **React Three Fiber 9** + drei + three.js |
| Dados | **PostgreSQL 17** + **Prisma 7** |
| Auth | **Better Auth** (e-mail/senha; Google opcional) |
| Pagamento | **Mercado Pago Checkout Pro** (webhook assinado) |
| Mídia / e-mail / agenda | Cloudflare R2 · Resend · Google Calendar API |
| Qualidade | Vitest + Playwright |
| Deploy | Docker Compose + **Caddy** (HTTPS) na VPS |
