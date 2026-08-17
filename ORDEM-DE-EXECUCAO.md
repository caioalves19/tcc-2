# Kolô — Ordem de execução das features

Checklist de construção. Cada item depende do que está acima. **P0** = defesa · **P1** = se der tempo · **P2** = cortar primeiro.

Fonte: `ESCOPO-E-STACK.md` · 68 features · 8 semanas.

---

## Fase 0 — Fundação (semana 1)

Infra, não é RF, mas nada sobe sem isso: repo, Docker Compose, Postgres, Prisma, layout, seed.

| # | ID | Feature | P |
|---|----|---------|---|
| 1 | RF08 | Papéis Cliente / Artista / Admin | P0 |
| 2 | RF01 | Cadastro (nome, e-mail, telefone, senha) | P0 |
| 3 | RF02 | Login com sessão no banco, revogável | P0 |
| 4 | RF04 | Recuperação de senha por e-mail | P0 |
| 5 | RF06 | Edição de perfil | P0 |
| 6 | RF05 | Verificação de e-mail | P1 |
| 7 | RF03 | Login com Google | P1 |

**Pronto quando:** qualquer integrante sobe o ambiente, cadastra e entra.

---

## Fase 1 — Acervo (semana 2)

Artistas e obras existem antes de loja, agenda e 3D.

| # | ID | Feature | P |
|---|----|---------|---|
| 8 | RF63 | CRUD de artistas, estilos e tags | P0 |
| 9 | RF62 | Upload de imagens (tipo, tamanho, miniatura) | P0 |
| 10 | RF61 | CRUD de obras (ficha, preço, situação, destaque) | P0 |
| 11 | RF11 | Listagem pública de artistas | P0 |
| 12 | RF12 | Página do artista (obras + portfólio + agendar) | P0 |
| 13 | RF20 | Catálogo em grade (paginação, ordenação) | P0 |
| 14 | RF21 | Filtros (artista, técnica, preço, tags, disponibilidade) | P0 |
| 15 | RF23 | Página da obra (zoom, fotos, ficha, relacionadas) | P0 |
| 16 | RF09 | Home (destaques, galeria, agendamento) | P0 |
| 17 | RF14 | Privacidade, termos e cancelamento | P0 |
| 18 | RF22 | Busca textual com acento | P1 |
| 19 | RF10 | Página Sobre editável | P1 |
| 20 | RF13 | Contato com antibot | P1 |
| 21 | RF66 | Configurações do site | P1 |

**Pronto quando:** admin cadastra uma obra e ela aparece no catálogo.

---

## Fase 2 — Loja (semana 3)

| # | ID | Feature | P |
|---|----|---------|---|
| 22 | RF07 | Endereços de entrega | P0 |
| 23 | RF24 | Carrinho persistente | P0 |
| 24 | RF28 | Reserva temporária da obra no checkout | P0 |
| 25 | RF25 | Checkout (resumo, endereço, frete, cupom) | P0 |
| 26 | RF26 | Mercado Pago (Pix, cartão, boleto) | P0 |
| 27 | RF27 | Pedido confirmado só no webhook aprovado | P0 |
| 28 | RF30 | E-mail a cada status do pedido | P0 |
| 29 | RF31 | Acompanhamento e rastreio pelo cliente | P0 |
| 30 | RF64 | Gestão de pedidos no admin | P0 |
| 31 | RF29 | Frete (retirada / valor fixo / tabela) | P1 |
| 32 | RF32 | Cancelar pedido não pago; estorno no admin | P1 |

**Pronto quando:** compra sandbox fecha, obra fica vendida, e-mail chega.

> Cupom no checkout (RF25) pode nascer desligado e ligar na fase 5 (RF56).

---

## Fase 3 — Agenda (semana 4)

| # | ID | Feature | P |
|---|----|---------|---|
| 33 | RF41 | Disponibilidade semanal do artista | P0 |
| 34 | RF42 | Bloqueio de datas (férias, feriados) | P0 |
| 35 | RF40 | Só horários realmente livres | P0 |
| 36 | RF37 | Wizard (artista → estilo → tamanho → refs → horário → termos) | P0 |
| 37 | RF38 | Upload de referências | P0 |
| 38 | RF43 | Solicitação → aprovação/recusa → confirmação | P0 |
| 39 | RF50 | Painel semanal do artista + pendentes | P0 |
| 40 | RF39 | Estimativa de duração e valor | P1 |
| 41 | RF45 | Remarcação / cancelamento com antecedência | P1 |
| 42 | RF46 | Compareceu / no-show | P1 |

**Pronto quando:** cliente solicita, artista aprova, não há horário duplicado.

---

## Fase 4 — Integrações da agenda + saúde (semana 5)

| # | ID | Feature | P |
|---|----|---------|---|
| 43 | RF47 | Google Calendar (criar / atualizar / cancelar) | P0 |
| 44 | RF48 | Lembrete por e-mail | P0 |
| 45 | RF49 | Link `wa.me` com código do agendamento | P0 |
| 46 | RF53 | Bloqueio de menor de 18 | P0 |
| 47 | RF52 | Termo de consentimento (data, hora, IP) | P0 |
| 48 | RF51 | Anamnese antes da sessão | P0 |
| 49 | RF44 | Sinal opcional via Mercado Pago | P1 |
| 50 | RF54 | Consentimento de uso de imagem | P1 |

**Pronto quando:** agendamento confirmado aparece no Calendar e gera lembrete.

---

## Fase 5 — Galeria 3D, portfólio e cupons (semana 6)

Galeria 3D por último entre os P0 visuais: o catálogo 2D já cobre a banca se o 3D atrasar.

| # | ID | Feature | P |
|---|----|---------|---|
| 51 | RF33 | Portfólio de tatuagens com filtros | P0 |
| 52 | RF34 | Busca no portfólio | P0 |
| 53 | RF35 | Gestão do portfólio (admin e artista) | P0 |
| 54 | RF18 | Fallback 2D da galeria (entregar **antes** do 3D) | P0 |
| 55 | RF15 | Sala 3D navegável | P0 |
| 56 | RF16 | Clique na obra → ficha e compra | P0 |
| 57 | RF36 | Tags do portfólio no wizard | P1 |
| 58 | RF17 | Curadoria 3D pelo admin (sem código) | P1 |
| 59 | RF56 | Cupons (valor / %, validade, limite, escopo) | P1 |
| 60 | RF19 | Várias salas temáticas | P2 |
| 61 | RF57 | Cupom de primeira compra / retorno | P2 |
| 62 | RF59 | Favoritos | P2 |
| 63 | RF58 | Recomendações por similaridade | P2 |

**Pronto quando:** dá para andar na sala, clicar na obra e comprar. Se o 3D falhar, a grade 2D (RF18) já vale.

---

## Fase 6 — Fechamento (semana 7)

| # | ID | Feature | P |
|---|----|---------|---|
| 64 | RF60 | Dashboard (faturamento, ticket, agenda, no-show) | P0 |
| 65 | RF65 | Perfil unificado do cliente no admin | P1 |
| 66 | RF67 | Auditoria de ações sensíveis | P1 |
| 67 | RF55 | LGPD: consultar, exportar, excluir dados | P1 |
| 68 | RF68 | Exportação CSV | P2 |

Em paralelo (não são RF, mas fecham a defesa): endurecer segurança, testes E2E, acessibilidade, Lighthouse.

---

## Fase 7 — Produção (semana 8)

Deploy na VPS, HTTPS, backup restaurado, validação com o cliente, roteiro da banca. Sem feature nova.

---

## Ordem de corte

Se o prazo apertar, pare de baixo para cima:

1. **P2** — RF19, 57, 58, 59, 68
2. **P1 de fidelização/admin** — RF56, 65, 66, 67, 55, 54, 36, 17
3. **P1 de loja/agenda** — RF03, 05, 10, 13, 22, 29, 32, 39, 44, 45, 46

**Não cortar:** Fases 0–4 P0 + fallback 2D + sala 3D (RF15/16) + dashboard. Sem isso a tese não fecha.
