# Kolô — Briefing de produto (TCC 2)

Plataforma web para o **Kolô Ateliê & Estúdio**: catálogo e venda de obras de arte, galeria 3D (substituto do espaço físico perdido) e agendamento de tatuagens. Entrega acadêmica em **8 semanas**, com uso real pelo cliente como bônus. Detalhamento em `ESCOPO-E-STACK.md`.

---

## Features propostas

| Frente | O que entra |
|--------|-------------|
| **Vitrine** | Home, artistas, catálogo de obras, portfólio de tatuagens, políticas e contato |
| **Galeria 3D** | Sala virtual navegável; clique na obra abre ficha e compra; fallback 2D se o dispositivo não aguentar WebGL |
| **E-commerce** | Carrinho, checkout, Mercado Pago (Pix/cartão/boleto), reserva da peça única, e-mail de status, rastreio |
| **Agendamento** | Wizard (artista → estilo → tamanho → referências → horário); horários reais; aprovação do artista; Google Calendar; lembrete por e-mail; WhatsApp só como link `wa.me` |
| **Conformidade** | Anamnese, termo de consentimento, bloqueio de menor de 18, LGPD básico |
| **Back-office** | CRUD de obras/artistas/portfólio, pedidos, agenda, dashboard, papéis Cliente / Artista / Admin |

**Não entra:** tour 360°, chatbot com IA, API oficial de WhatsApp, marketplace com split, app nativo, NF-e.

---

## Faz sentido?

**Sim.** O conjunto fecha o problema do TCC 1 (operação manual + ausência de canal assíncrono) e ainda ganha justificativa mais forte: sem espaço físico, a galeria 3D deixa de ser “enfeite” e passa a ser a exposição.

O recorte está coerente com prazo e prioridade acadêmica: loja única (sem split), pagamentos em sandbox, WhatsApp sem burocracia da Meta, wizard determinístico em vez de LLM. Anamnese e LGPD preenchem uma lacuna real do documento anterior e protegem a banca.

O risco não é o desenho — é **volume**. Núcleo obrigatório (P0): autenticação, catálogo, compra completa, agendamento completo, galeria 3D + fallback, back-office mínimo. Cupons, recomendações, múltiplas salas e exportação CSV são incrementos; cortar esses primeiro se o prazo apertar.

---

## Stack necessária

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

**Por quê essa, e não React + Laravel + MySQL:** uma linguagem, um deploy, tipos de ponta a ponta (melhor com IA), galeria 3D no mesmo projeto. Postgres impede agendamento sobreposto no banco. Continua React, monolito, REST, Mercado Pago e modelo relacional — o capítulo teórico do TCC 1 quase não muda.
