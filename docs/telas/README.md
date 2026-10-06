# Telas de referência (Google Stitch)

Telas do projeto "Plataforma Kolô: Ateliê & Tattoo" no Google Stitch, já alinhadas ao ESCOPO v2.2.
Exportadas em 05/10/2026 e renderizadas em página inteira: desktop em 1280 px e celular em 390 px
(imagem em 2x).

## Como usar

- **São referência visual, não especificação.** Valem o [ESCOPO v2.2](../ESCOPO-E-STACK.md), os
  critérios do PBI e os tokens de [IDENTIDADE-VISUAL.md](../IDENTIDADE-VISUAL.md).
- **Os textos e dados são inventados pelo Stitch:** nomes de artistas, obras, preços, endereço,
  prazos, certificados. Não copie conteúdo. As políticas, por exemplo, foram escritas do zero no
  PBI-22.
- **Se a tela mostrar algo fora do escopo, vale o escopo.** Exemplos: agenda com horários livres,
  coleta de dados de saúde, filtros de catálogo.
- **Implemente com os componentes e tokens do projeto** (`src/components/ui`, papéis `--kolo-*`),
  não com o HTML/Tailwind que o Stitch gera.
- O avatar redondo do cabeçalho aparece quebrado: é uma imagem interna do Stitch, sem efeito no
  projeto.

## Ateliê: vitrine

| Tela             | Desktop                                      | Celular                                      | PBI                          |
| ---------------- | -------------------------------------------- | -------------------------------------------- | ---------------------------- |
| Home             | [desktop](atelie/home-desktop.webp)          | [celular](atelie/home-celular.webp)          | 21 (chamada do wizard no 33) |
| Catálogo         | [desktop](atelie/catalogo-desktop.webp)      | [celular](atelie/catalogo-celular.webp)      | 19                           |
| Página da obra   | [desktop](atelie/obra-desktop.webp)          | [celular](atelie/obra-celular.webp)          | 20                           |

## Loja

| Tela                    | Desktop                                                                                          | Celular                                                 | PBI        |
| ----------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | ---------- |
| Carrinho                | [desktop](loja/carrinho-desktop.webp) · [variante](loja/carrinho-desktop-variante.webp)          | [celular](loja/carrinho-celular.webp)                   | 24         |
| Checkout                | [desktop](loja/checkout-desktop.webp)                                                            | [celular](loja/checkout-celular.webp)                   | 23 e 26    |
| Reserva expirada        | [desktop](loja/reserva-expirada-desktop.webp)                                                    | [celular](loja/reserva-expirada-celular.webp)           | 25         |
| Confirmando pagamento   | [desktop](loja/confirmando-pagamento-desktop.webp)                                               | [celular](loja/confirmando-pagamento-celular.webp)      | 27 e 28    |
| Pedido confirmado       | [desktop](loja/pedido-confirmado-desktop.webp)                                                   | [celular](loja/pedido-confirmado-celular.webp)          | 28         |

## Conta

| Tela                  | Desktop                                            | Celular                                            | PBI                          |
| --------------------- | -------------------------------------------------- | -------------------------------------------------- | ---------------------------- |
| Área do cliente       | [desktop](conta/area-do-cliente-desktop.webp)      | [celular](conta/area-do-cliente-celular.webp)      | 29 (perfil já feito no 15)   |
| Login                 | [desktop](conta/login-desktop.webp)                | [celular](conta/login-celular.webp)                | 13 (Sprint 1, feito)         |
| Cadastro              | [desktop](conta/cadastro-desktop.webp)             | [celular](conta/cadastro-celular.webp)             | 12 (Sprint 1, feito)         |
| Recuperar senha       | [desktop](conta/recuperar-senha-desktop.webp)      | [celular](conta/recuperar-senha-celular.webp)      | 14 (Sprint 1, feito)         |

## Institucional

| Tela      | Desktop                                            | Celular                                            | PBI                               |
| --------- | -------------------------------------------------- | -------------------------------------------------- | --------------------------------- |
| Políticas | [desktop](institucional/politicas-desktop.webp)    | [celular](institucional/politicas-celular.webp)    | 22 (feito; textos não aproveitados) |
| Contato   | [desktop](institucional/contato-desktop.webp)      | [celular](institucional/contato-celular.webp)      | 44                                |

## Tattoo

| Tela      | Desktop                                     | Celular                                     | PBI      |
| --------- | ------------------------------------------- | ------------------------------------------- | -------- |
| Portfólio | [desktop](tattoo/portfolio-desktop.webp)    | [celular](tattoo/portfolio-celular.webp)    | 36 e 37  |

### Wizard de tatuagem (8 etapas, como no PBI-31)

| Etapa          | Desktop                                              | Celular                                              | PBI |
| -------------- | ---------------------------------------------------- | ---------------------------------------------------- | --- |
| 1. Nome        | [desktop](tattoo/wizard-1-nome-desktop.webp)         | [celular](tattoo/wizard-1-nome-celular.webp)         | 31  |
| 2. Artista     | [desktop](tattoo/wizard-2-artista-desktop.webp)      | [celular](tattoo/wizard-2-artista-celular.webp)      | 31  |
| 3. Estilo      | [desktop](tattoo/wizard-3-estilo-desktop.webp)       | [celular](tattoo/wizard-3-estilo-celular.webp)       | 31  |
| 4. Região      | [desktop](tattoo/wizard-4-regiao-desktop.webp)       | [celular](tattoo/wizard-4-regiao-celular.webp)       | 31  |
| 5. Tamanho     | [desktop](tattoo/wizard-5-tamanho-desktop.webp)      | [celular](tattoo/wizard-5-tamanho-celular.webp)      | 31  |
| 6. Data        | [desktop](tattoo/wizard-6-data-desktop.webp)         | [celular](tattoo/wizard-6-data-celular.webp)         | 31  |
| 7. Avisos      | [desktop](tattoo/wizard-7-avisos-desktop.webp)       | [celular](tattoo/wizard-7-avisos-celular.webp)       | 32  |
| 8. WhatsApp    | [desktop](tattoo/wizard-8-whatsapp-desktop.webp)     | [celular](tattoo/wizard-8-whatsapp-celular.webp)     | 33  |

Ficaram de fora as versões antigas que ainda estão no Stitch: o wizard de 6 etapas com calendário
de horários (cortado na v2.2), a proposta de 3 etapas ("Sua ideia") e a confirmação no visual do
Ateliê.

## O que não tem tela

As telas de administração (PBIs 16, 18, 30, 34, 35, 38 e 39) não foram desenhadas no Stitch. Siga o
layout do `/admin` criado no PBI-16.
