# Kolô — Escopo e Stack (TCC 2)

> **Versão:** 2.1 · **Data:** agosto de 2026 · **Fase:** TCC 2 — implementação
> **Equipe:** Caio Scorsoni, Caio Vinicius, Guilherme Salustiano, Gustavo Magalhães, Robert Estevan

---

## Sumário

1. [Contexto](#1-contexto)
2. [Decisões de escopo](#2-decisões-de-escopo)
3. [Visão do produto](#3-visão-do-produto)
4. [Requisitos funcionais](#4-requisitos-funcionais)
5. [Requisitos não funcionais](#5-requisitos-não-funcionais)
6. [Regras de negócio](#6-regras-de-negócio)
7. [Papéis e permissões](#7-papéis-e-permissões)
8. [Stack](#8-stack)
9. [Arquitetura](#9-arquitetura)
10. [Modelo de dados](#10-modelo-de-dados)
11. [Integrações externas](#11-integrações-externas)
12. [Infraestrutura e deploy](#12-infraestrutura-e-deploy)
13. [Qualidade e testes](#13-qualidade-e-testes)
14. [Fora de escopo](#14-fora-de-escopo)

---

## 1. Contexto

O Kolô é um ateliê e estúdio de tatuagem que integra artistas plásticos, tatuadores residentes e a comunidade artística. A operação é manual: vendas controladas fora de sistema, ausência de catálogo consultável, agendamentos negociados em conversas e nenhum histórico estruturado de clientes.

O Kolô não tem mais espaço físico em Pinheiros. A plataforma web passa a ser o canal principal de exposição, venda e agendamento.

---

## 2. Decisões de escopo

| Tema | Decisão |
|------|---------|
| Objetivo primário | Entrega acadêmica. Uso real pelo cliente é bem-vindo, mas não condiciona o escopo. |
| Modelo de vendas | Loja única. O Kolô cadastra e vende as obras; repasse aos artistas é acordado fora do sistema. |
| Visualização 3D | Visualizador interativo na ficha de cada obra (rotação e zoom). Catálogo em grade 2D. Sem sala virtual navegável. |
| Pagamentos | Mercado Pago em sandbox, com código pronto para produção (troca de credenciais). |
| WhatsApp | Sem API oficial. Notificações transacionais por e-mail + deep links `wa.me` com mensagem pré-preenchida. |
| Assistente de agendamento | Wizard guiado por regras (determinístico, auditável, testável). Sem LLM. |
| Conformidade da tatuagem | Presencial. O sistema alerta e exige checks; anamnese, termo e identidade/maioridade são conferidos na sessão. Não armazena dado de saúde. |
| Hospedagem | VPS própria (~R$ 30–60/mês), administrada pela equipe, com Docker Compose. |
| Prazo | 8 semanas. |

---

## 3. Visão do produto

Uma aplicação web única, responsiva, com três frentes de valor:

| Vitrine pública | Área do cliente | Back-office |
|-----------------|-----------------|-------------|
| Catálogo de obras em grade 2D | Meus pedidos e rastreio | Dashboard e indicadores |
| Visualização 3D na ficha da obra | Meus agendamentos | Acervo e gestão de obras |
| Portfólio de tatuagens | Avisos e checks do agendamento | Portfólio e estilos |
| Artistas residentes | Endereços de entrega | Artistas |
| Wizard de agendamento | Meus dados | Agenda e regras de disponibilidade |
| Carrinho e checkout | | Pedidos e envios |
| Contato e políticas | | Clientes |

---

## 4. Requisitos funcionais

**Prioridade:** `P0` indispensável para a defesa · `P1` importante, entra se o P0 fechar no prazo · `P2` incremento desejável.

### 4.1 Contas e autenticação

| ID | Requisito | Prio |
|----|-----------|------|
| RF01 | Cadastro de cliente com nome, e-mail, telefone e senha | P0 |
| RF02 | Login por e-mail e senha, com sessão persistida no banco e revogável | P0 |
| RF03 | Login social com Google | P1 |
| RF04 | Recuperação de senha por e-mail com token de uso único e expiração | P0 |
| RF05 | Edição de perfil: dados pessoais, telefone e senha | P0 |
| RF06 | Gestão de endereços de entrega (múltiplos, com um padrão) | P0 |
| RF07 | Controle de acesso por papel: `CLIENTE`, `ARTISTA`, `ADMIN` | P0 |

### 4.2 Vitrine institucional

| ID | Requisito | Prio |
|----|-----------|------|
| RF08 | Home com obras em destaque e chamada para o agendamento | P0 |
| RF09 | Listagem de artistas residentes com bio, foto, estilos e link do Instagram | P0 |
| RF10 | Página individual do artista, agregando obras, portfólio e botão de agendar | P0 |
| RF11 | Páginas de política de privacidade, termos de uso e política de cancelamento | P0 |

### 4.3 Catálogo e visualização 3D

| ID | Requisito | Prio |
|----|-----------|------|
| RF12 | Catálogo de obras em grade 2D, com paginação e ordenação (recentes, preço, destaque) | P0 |
| RF13 | Filtros por artista, técnica, faixa de preço e disponibilidade | P0 |
| RF14 | Página da obra com galeria de fotos, ficha técnica e visualização interativa em 3D (rotação e zoom) | P0 |
| RF15 | Fallback automático para fotos 2D quando o dispositivo não suportar WebGL ou tiver desempenho insuficiente | P0 |

### 4.4 E-commerce

| ID | Requisito | Prio |
|----|-----------|------|
| RF16 | Carrinho persistente: mantém itens entre sessões para usuário logado, e por cookie para visitante | P0 |
| RF17 | Checkout com resumo do pedido, seleção de endereço e frete | P0 |
| RF18 | Pagamento via Mercado Pago com Pix, cartão e boleto, sem trafegar dados de cartão pelo sistema | P0 |
| RF19 | Confirmação automática do pedido ao receber a notificação de pagamento aprovado | P0 |
| RF20 | Reserva temporária da obra durante o checkout, expirando se o pagamento não for concluído | P0 |
| RF21 | E-mail transacional em cada transição de status do pedido | P0 |
| RF22 | Acompanhamento do pedido pelo cliente, com status e código de rastreio | P0 |

### 4.5 Portfólio de tatuagens

| ID | Requisito | Prio |
|----|-----------|------|
| RF23 | Galeria de trabalhos realizados, filtrável por artista, estilo e região do corpo | P0 |
| RF24 | Busca no portfólio por estilo e palavra-chave | P0 |
| RF25 | Gestão de fotos do portfólio pelo admin e pelo próprio artista: incluir, editar, ordenar, destacar e remover | P0 |

### 4.6 Agendamento de tatuagens

| ID | Requisito | Prio |
|----|-----------|------|
| RF26 | Wizard de solicitação em etapas: artista → estilo → região do corpo → tamanho → referências → data/horário → checks de conformidade → confirmação | P0 |
| RF27 | Upload de imagens de referência pelo cliente, com limite de quantidade e tamanho | P0 |
| RF28 | Exibição apenas dos horários realmente livres, considerando regras de disponibilidade, agendamentos existentes, intervalo entre sessões e bloqueios | P0 |
| RF29 | Definição pelo artista/admin de disponibilidade semanal recorrente, com duração de sessão e intervalo | P0 |
| RF30 | Bloqueio de datas e períodos específicos (férias, feriados, eventos) | P0 |
| RF31 | Fluxo de aprovação: solicitação → aprovada/recusada pelo artista → confirmada com o cliente | P0 |
| RF32 | Sincronização do agendamento confirmado com o Google Calendar do estúdio, refletindo alterações e cancelamentos | P0 |
| RF33 | Lembrete automático por e-mail com antecedência configurável | P0 |
| RF34 | Botão de contato via WhatsApp com mensagem pré-preenchida contendo o código do agendamento | P0 |
| RF35 | Painel de agenda do artista, em visão semanal, com as solicitações pendentes | P0 |

### 4.7 Conformidade

O sistema não coleta ficha de saúde. Anamnese, termo de consentimento informado e documento de identidade/maioridade são apresentados e conferidos na sessão. O software só alerta, exige o aceite dos avisos e registra a conferência feita pelo estúdio.

| ID | Requisito | Prio |
|----|-----------|------|
| RF36 | Alerta e checkbox obrigatórios: a ficha de anamnese será preenchida presencialmente; ausência pode cancelar o horário | P0 |
| RF37 | Alerta e checkbox obrigatórios: o termo de consentimento será assinado presencialmente; ausência pode cancelar o horário | P0 |
| RF38 | Alerta e checkbox obrigatórios de declaração de maioridade (18+); identidade e idade conferidas na sessão | P0 |

### 4.8 Back-office

| ID | Requisito | Prio |
|----|-----------|------|
| RF39 | Dashboard com faturamento do período, obras vendidas e agendamentos por status | P0 |
| RF40 | CRUD de obras com múltiplas imagens, ficha técnica, preço, situação e destaque | P0 |
| RF41 | Upload de imagens com validação de tipo e tamanho, geração de miniaturas e otimização | P0 |
| RF42 | CRUD de artistas, estilos e tags | P0 |
| RF43 | Gestão de pedidos: alterar status, registrar rastreio, ver dados de pagamento e reenviar e-mails | P0 |
| RF44 | Gestão de clientes: perfil unificado com compras, agendamentos e conferências presenciais | P1 |
| RF45 | Configurações do site: dados de contato, horários, textos institucionais e políticas | P1 |

---

## 5. Requisitos não funcionais

### Segurança

| ID | Requisito | Verificação |
|----|-----------|-------------|
| RNF01 | Todo o tráfego em HTTPS, com certificado válido, renovação automática e redirecionamento de HTTP | SSL Labs nota A |
| RNF02 | Runtime, framework e dependências em versões com suporte ativo de segurança | `npm audit` sem vulnerabilidade alta/crítica |
| RNF03 | Senhas armazenadas apenas como hash com algoritmo de derivação lento e salt por usuário | Inspeção do banco |
| RNF04 | Prevenção de SQL Injection por consultas parametrizadas via ORM | Revisão de código + teste |
| RNF05 | Prevenção de XSS por escape automático na renderização e Content-Security-Policy restritiva | Teste manual com payloads |
| RNF06 | Proteção CSRF em todas as operações de escrita, com cookies `HttpOnly`, `Secure` e `SameSite` | Teste manual |
| RNF07 | Cabeçalhos de segurança: HSTS, X-Content-Type-Options, Referrer-Policy, X-Frame-Options | securityheaders.com nota A |
| RNF08 | Limitação de taxa em login, recuperação de senha, contato e agendamento | Teste de carga pontual |
| RNF09 | Validação de toda entrada no servidor por esquema declarado | Testes automatizados |
| RNF10 | Nenhum dado de cartão trafega ou é armazenado pelo sistema | Revisão de arquitetura |
| RNF11 | Webhooks de pagamento com verificação de assinatura e tratamento idempotente | Teste de reenvio |
| RNF12 | Segredos exclusivamente em variáveis de ambiente, nunca versionados | Varredura no repositório |

### Desempenho e disponibilidade

| ID | Requisito | Verificação |
|----|-----------|-------------|
| RNF13 | Páginas de catálogo e obra com LCP abaixo de 2,5 s em 4G simulado | Lighthouse ≥ 90 |
| RNF14 | Visualizador 3D com no mínimo 30 FPS em notebook intermediário; degradação automática de qualidade em dispositivos fracos | Medição com FPS meter |
| RNF15 | Imagens servidas em formato moderno, com dimensões responsivas e carregamento diferido | Auditoria de rede |
| RNF16 | Disponibilidade 24/7, com reinício automático de contêiner em falha | Política de restart + monitor |
| RNF17 | Backup diário automatizado do banco, com retenção mínima de 7 dias e restauração testada | Restauração documentada |

### Privacidade e conformidade

| ID | Requisito | Verificação |
|----|-----------|-------------|
| RNF18 | Coleta limitada ao mínimo necessário, com finalidade declarada na política de privacidade | Inventário de dados |
| RNF19 | O sistema não persiste anamnese nem outras respostas clínicas | Inspeção do esquema e do banco |
| RNF20 | Checks de aviso e conferência do staff registrados no agendamento com data e hora | Inspeção do banco |
| RNF21 | Exclusão de conta anonimiza o cliente preservando a integridade contábil dos pedidos | Teste funcional |

### Usabilidade e manutenção

| ID | Requisito | Verificação |
|----|-----------|-------------|
| RNF22 | Interface responsiva de 320 px a 1920 px, sem rolagem horizontal | Playwright em 3 viewports |
| RNF23 | Acessibilidade: navegação por teclado, foco visível, contraste AA e textos alternativos em imagens | axe-core sem violação crítica |
| RNF24 | Tipagem estática estrita, lint e formatação obrigatórios, com CI barrando merge em falha | Pipeline verde |
| RNF25 | Ambiente de desenvolvimento reproduzível por um único comando, com dados de exemplo | README validado por membro novo |
| RNF26 | Registro estruturado de logs e captura centralizada de exceções em produção | Erro de teste visível no painel |

---

## 6. Regras de negócio

| ID | Regra |
|----|-------|
| RN01 | Catálogo, galeria e portfólio são públicos; compra, agendamento e área pessoal exigem autenticação. |
| RN02 | Cada obra é peça única: estoque igual a 1 e uma única venda possível. |
| RN03 | Obra em checkout é reservada por 30 minutos; expirado o prazo sem pagamento aprovado, volta a ficar disponível. |
| RN04 | Duas pessoas não podem comprar a mesma obra: a reserva é garantida por transação no banco. |
| RN05 | Pedido só é considerado pago quando o gateway retorna o pagamento como aprovado. |
| RN06 | Pix e boleto geram pedido pendente; a obra permanece reservada até a aprovação ou a expiração do meio de pagamento. |
| RN07 | Preços são armazenados em centavos, como inteiros, para evitar erro de ponto flutuante. |
| RN08 | Um artista não pode ter dois agendamentos sobrepostos no mesmo intervalo, restrição garantida pelo próprio banco de dados. |
| RN09 | Horários ofertados respeitam a disponibilidade semanal, os bloqueios, o intervalo mínimo entre sessões e a antecedência mínima de agendamento. |
| RN10 | Solicitação de agendamento nasce como pendente e só ocupa a agenda de forma definitiva após aprovação do artista. |
| RN11 | Cancelamento de agendamento segue a política de cancelamento publicada no site; o sistema não cobra nem retém valores. |
| RN12 | Nenhuma sessão pode ser marcada como concluída sem o staff confirmar a conferência presencial de anamnese, termo de consentimento e documento de identidade/maioridade. |
| RN13 | Agendamento exige declaração de maioridade no wizard. A prova é o documento na sessão; sem documento o horário é cancelado. |
| RN14 | (removida na v2.1 — fotos do portfólio não exibem rosto; sem registro de autorização de imagem) |
| RN15 | Todos os horários são armazenados em UTC e apresentados em `America/Sao_Paulo`. |
| RN16 | Artista acessa e edita apenas o próprio portfólio, a própria agenda e os agendamentos dos quais é responsável. |
| RN17 | (removida na v2.1 — log de auditoria fora de escopo, seção 14) |
| RN18 | Obra vendida deixa o catálogo de compra, mas permanece visível no acervo marcada como vendida. |
| RN19 | Cliente exclui a própria conta, mas os pedidos pagos são preservados de forma anonimizada. |

---

## 7. Papéis e permissões

| Recurso | Visitante | Cliente | Artista | Admin |
|---------|:---------:|:-------:|:-------:|:-----:|
| Catálogo, visualização 3D, portfólio | ✓ | ✓ | ✓ | ✓ |
| Comprar obra | — | ✓ | ✓ | ✓ |
| Solicitar agendamento | — | ✓ | ✓ | ✓ |
| Ver os próprios pedidos e agendamentos | — | ✓ | ✓ | ✓ |
| Gerenciar o próprio portfólio e agenda | — | — | ✓ | ✓ |
| Aprovar/recusar agendamento próprio | — | — | ✓ | ✓ |
| Confirmar conferência presencial no agendamento | — | — | ✓ (só dos seus) | ✓ |
| Gerenciar obras, artistas e clientes | — | — | — | ✓ |
| Gerenciar pedidos e envios | — | — | — | ✓ |
| Configurações do site | — | — | — | ✓ |

---

## 8. Stack

Uma aplicação TypeScript full-stack (monolito modular), Docker na VPS.

| Camada | Tecnologia |
|--------|------------|
| Linguagem | **TypeScript** (modo estrito) |
| Runtime | **Node.js** 24 LTS |
| Framework full-stack | **Next.js** 16 (App Router) |
| Biblioteca de UI | **React** 19 |
| Estilização | **Tailwind CSS** 4 |
| Componentes | **shadcn/ui** sobre Radix UI |
| Formulários e validação | **React Hook Form + Zod** |
| 3D | **three.js + React Three Fiber 9 + drei** |
| Banco | **PostgreSQL 17** |
| ORM e migrações | **Prisma 7** |
| Autenticação | **Better Auth** |
| Pagamentos | **Mercado Pago Checkout Pro** + SDK Node oficial |
| Armazenamento de mídia | **Cloudflare R2** (compatível com S3) |
| E-mail transacional | **Resend + React Email** |
| Calendário | **Google Calendar API** via `googleapis`, com conta de serviço |
| WhatsApp | **Deep links `wa.me`** com mensagem pré-preenchida |
| Tarefas agendadas | **pg-boss** (fila no próprio Postgres) |
| Antibot | **Cloudflare Turnstile** |
| Testes unitários | **Vitest + Testing Library** |
| Testes de ponta a ponta | **Playwright** |
| Acessibilidade | **axe-core** integrado ao Playwright |
| Lint e formatação | **ESLint 9 + Prettier** |
| Integração contínua | **GitHub Actions** |
| Contêineres | **Docker + Docker Compose** |
| Proxy reverso e TLS | **Caddy** |
| Observabilidade | **pino + Sentry** |

---

## 9. Arquitetura

Monolito modular em contêineres, na VPS:

```mermaid
graph TB
    subgraph Cliente
        B["Navegador<br/>React 19 · Visualização 3D WebGL"]
    end

    subgraph VPS["VPS — Docker Compose"]
        C["Caddy<br/>TLS automático · cabeçalhos · rate limit"]
        A["Next.js 16<br/>RSC · Server Actions · Route Handlers"]
        W["pg-boss<br/>lembretes · expiração de reserva · backup"]
        D[("PostgreSQL 17")]
    end

    subgraph Externos["Serviços externos"]
        MP["Mercado Pago<br/>Checkout Pro + webhook"]
        GC["Google Calendar API"]
        R2["Cloudflare R2<br/>imagens"]
        RS["Resend<br/>e-mail"]
        SE["Sentry"]
    end

    B -->|HTTPS| C --> A
    A --> D
    W --> D
    A -.->|enfileira| W
    A <-->|REST| MP
    MP -->|webhook assinado| C
    A -->|REST| GC
    B <-->|upload assinado| R2
    A --> R2
    A --> RS
    A --> SE
```

Organização interna por domínio:

```
src/
  app/                      # rotas (App Router)
    (site)/                 # vitrine pública: home, catálogo, portfólio, artistas
    (loja)/                 # carrinho, checkout, retorno de pagamento
    (conta)/                # área do cliente
    (admin)/                # back-office
    api/
      webhooks/mercadopago/ # Route Handler do webhook
      cron/                 # gatilhos protegidos de tarefas
  modules/
    catalog/                # obras, imagens, filtros, busca
    viewer3d/               # visualizador 3D, fallback 2D
    orders/                 # carrinho, pedido, frete
    payments/               # Mercado Pago, webhook, idempotência
    scheduling/             # disponibilidade, slots, agendamento, Google Calendar
    portfolio/              # trabalhos de tatuagem
    artists/                # artistas e estilos
    customers/              # perfil, endereços, exclusão LGPD
    notifications/          # e-mail, templates, links wa.me
    admin/                  # dashboard, configurações
  components/ui/            # design system (shadcn/ui)
  lib/                      # db, auth, storage, env, logger, utilitários de data
prisma/schema.prisma        # contrato do modelo de dados
tests/e2e/                  # Playwright
```

---

## 10. Modelo de dados

Entidades principais:

**Identidade e pessoas**
`user` (papel, nome, e-mail, telefone, situação) · `session` · `account` (OAuth) · `verification` · `address` · `artist` (perfil público vinculado a um usuário: slug, bio, avatar, Instagram, estilos)

**Acervo**
`artwork` (título, slug, descrição, artista, técnica, dimensões, ano, preço em centavos, situação: rascunho/disponível/reservada/vendida, destaque) · `artwork_image` (URL, ordem, principal, texto alternativo) · `tag` · `artwork_tag`

**Comércio**
`cart` · `cart_item` · `order` (número, cliente, situação, subtotal, desconto, frete, total, endereço em cópia imutável, código de rastreio, datas) · `order_item` (com cópia de título e preço no momento da compra) · `payment` (provedor, id externo, método, situação, valor, payload em JSONB) · `webhook_event` (id do evento único, garantindo idempotência) · `artwork_reservation` (obra, sessão, expiração)

**Tatuagem e agenda**
`tattoo_style` · `portfolio_item` (artista, imagem, estilos, região do corpo, duração) · `size_tier` (faixa de tamanho com duração e preço-base) · `availability_rule` (artista, dia da semana, início, fim, duração de sessão, intervalo) · `time_block` (bloqueios e compromissos externos) · `appointment` (código, cliente, artista, situação, início, fim, duração estimada, região do corpo, estilo, descrição, orçamento, id do evento no Google; aceites dos avisos no wizard com data e hora; flags de conferência presencial pelo staff: anamnese apresentada, termo assinado, identidade conferida) · `appointment_reference` (imagens de referência)

**Operação**
`site_setting` · `contact_message` · `email_log`

Convenções: identificadores UUID; valores monetários em centavos como inteiros (RN07); datas em UTC com fuso de apresentação fixo (RN15); exclusão lógica onde houver relevância contábil; restrição de exclusão por intervalo em `appointment` (RN08); índices de busca textual em `artwork` e `portfolio_item`.

---

## 11. Integrações externas

### Mercado Pago (Checkout Pro, sandbox)

1. O cliente finaliza o carrinho; o sistema cria o pedido como pendente e reserva a obra (RN03).
2. O servidor cria uma preferência de pagamento com os itens, as URLs de retorno, a URL de notificação e o número do pedido como referência externa.
3. O cliente é redirecionado ao checkout hospedado e paga com Pix, cartão ou boleto.
4. O Mercado Pago envia webhook para nosso Route Handler; validamos a assinatura HMAC do cabeçalho `x-signature` e respondemos rapidamente com 200.
5. Consultamos o pagamento pela API para obter a situação real — o status nunca é lido da URL de retorno do navegador (RN05).
6. Somente com pagamento aprovado o pedido é confirmado, a obra marcada como vendida e o e-mail enviado. O evento é registrado por id único, de modo que reenvios não processem duas vezes (RNF11).

### Google Calendar

Conta de serviço com o calendário do estúdio compartilhado com ela. Agendamento confirmado gera evento; remarcação atualiza; cancelamento remove.

### E-mail

Templates como componentes React: confirmação de cadastro, recuperação de senha, pedido recebido, pagamento aprovado, pedido enviado, solicitação de agendamento recebida, agendamento aprovado, lembrete de sessão, cancelamento. Cada envio registrado em `email_log` para permitir reenvio pelo admin.

### WhatsApp

Sem API oficial. Botões geram links `https://wa.me/<numero>?text=<mensagem>` com contexto pré-preenchido — por exemplo, o código do agendamento e o nome do cliente.

### Armazenamento de imagens

Upload direto do navegador para o R2 com URL assinada de curta duração, validando tipo e tamanho antes de emitir a assinatura. O servidor guarda apenas a chave do objeto. Entrega otimizada e responsiva pelo componente de imagem do Next.js (RNF15).

---

## 12. Infraestrutura e deploy

**VPS mínima recomendada:** 2 vCPU, 4 GB de RAM, 40 GB SSD, Ubuntu LTS.

**Contêineres:** `caddy` (proxy reverso e TLS) · `app` (Next.js em build de produção, executando as migrações no start) · `postgres` (volume persistente) · `backup` (rotina de dump agendado).

**Publicação:** push na branch principal dispara o GitHub Actions, que roda tipagem, lint, testes e build; aprovado, conecta por SSH, atualiza o código e recria os contêineres. Rollback por tag da imagem anterior.

**Endurecimento do servidor:** acesso SSH apenas por chave, com senha e root desabilitados; firewall liberando somente 22, 80 e 443; `fail2ban`; atualizações de segurança automáticas; Postgres sem porta exposta à internet; segredos em arquivo de ambiente fora do versionamento (RNF12).

**Backup:** dump diário comprimido, enviado ao R2, com retenção de 7 dias e restauração testada ao menos uma vez e documentada (RNF17).

**Ambiente local:** `docker compose up` sobe banco e aplicação; um comando de seed popula obras, artistas, estilos e um agendamento de exemplo (RNF25).

---

## 13. Qualidade e testes

| Tipo | Ferramenta | O que cobre |
|------|-----------|-------------|
| Unitário | Vitest | Cálculo de total e desconto, geração de horários disponíveis, transições de status |
| Integração | Vitest + Postgres em contêiner | Reserva concorrente da mesma obra, restrição de sobreposição de agenda, idempotência do webhook |
| Ponta a ponta | Playwright | Cadastro → navegação no catálogo → compra com pagamento aprovado em sandbox → pedido confirmado; e wizard completo de agendamento até o evento no calendário |
| Responsividade | Playwright em 320, 768 e 1440 px | RNF22, com capturas de tela como evidência no documento |
| Acessibilidade | axe-core | RNF23 |
| Desempenho | Lighthouse CI | RNF13 |
| Aceitação | Roteiro assistido com o cliente | Validação com registro de feedback e ajustes |

Cada requisito funcional P0 deve ter ao menos um teste automatizado associado.

---

## 14. Fora de escopo

Aplicativo móvel nativo · marketplace com contas de vendedor e divisão automática de pagamento · sala virtual navegável · tour virtual 360° · chatbot com IA conversacional · emissão de nota fiscal e integração contábil · integração com Correios em tempo real ou etiqueta de envio · controle de estoque de insumos do estúdio · múltiplos idiomas e moedas · funcionamento offline como PWA · integração com maquininha ou ponto de venda físico · assinatura ou clube de membros · ficha de anamnese digital e armazenamento de dados de saúde · termo de consentimento com valor jurídico no sistema · cupons de desconto · recomendações personalizadas · lista de desejos / favoritos · exportação de dados em CSV · verificação de e-mail no cadastro · cobrança de sinal para agendamento · remarcação e cancelamento pelo cliente · registro de comparecimento · estimativa automática de duração e valor · uso de imagem no portfólio · log de auditoria · múltiplas salas/exposições temáticas · curadoria de paredes/salas pelo administrador.
