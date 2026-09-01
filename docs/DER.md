# Kolô — Diagrama Entidade-Relacionamento (DER)

Fonte: seção 10 de `ESCOPO-E-STACK.md` (versão 2.1, agosto 2026), alinhado a `TCC.txt`.

Convenções do modelo: identificadores UUID; valores monetários em centavos (`int`, RN07); datas em UTC, apresentadas em `America/Sao_Paulo` (RN15); exclusão lógica onde houver relevância contábil. Não há entidade de ficha clínica (`health_form`) nem armazenamento do teor do termo — os aceites do wizard e a conferência presencial ficam em `appointment` (RN03, RNF19, RNF20).

```mermaid
erDiagram
    %% ===== Identidade e pessoas =====
    user ||--o{ session : "sessões"
    user ||--o{ account : "contas"
    user ||--o{ address : "endereços"
    user ||--o| artist : "perfil público"
    user ||--o{ cart : "carrinhos"
    user ||--o{ order : "pedidos"
    user ||--o{ appointment : "agendamentos"
    user ||--o{ email_log : "e-mails"

    %% ===== Acervo =====
    artist ||--o{ artwork : "obras"
    artist }o--o{ tattoo_style : "estilos"
    artist ||--o{ portfolio_item : "portfólio"
    artist ||--o{ availability_rule : "disponibilidade"
    artist ||--o{ time_block : "bloqueios"
    artist ||--o{ appointment : "agenda"

    artwork ||--o{ artwork_image : "imagens"
    artwork ||--o{ artwork_tag : "classificação"
    tag ||--o{ artwork_tag : "obras"
    artwork ||--o{ cart_item : "no carrinho"
    artwork ||--o{ order_item : "vendida em"
    artwork ||--o{ artwork_reservation : "reservas"

    %% ===== Comércio =====
    cart ||--o{ cart_item : "itens"
    order ||--o{ order_item : "itens"
    order ||--o{ payment : "pagamentos"
    session ||--o{ artwork_reservation : "reserva"

    %% ===== Tatuagem e agenda =====
    portfolio_item }o--o{ tattoo_style : "estilos"
    tattoo_style ||--o{ appointment : "estilo"
    size_tier ||--o{ appointment : "faixa"
    appointment ||--o{ appointment_reference : "referências"

    user {
        uuid id PK
        enum papel "CLIENTE ARTISTA ADMIN"
        string nome
        string email UK
        string telefone
        enum situacao
        boolean email_verificado
        text preferencias_comunicacao
        text anotacoes_internas
        timestamptz excluido_em
    }

    session {
        uuid id PK
        uuid user_id FK
        string token UK
        timestamptz expira_em
        string ip
        string user_agent
    }

    account {
        uuid id PK
        uuid user_id FK
        string provedor
        string id_externo
        string senha_hash
        text tokens_oauth
    }

    verification {
        uuid id PK
        string identificador
        string valor
        timestamptz expira_em
    }

    address {
        uuid id PK
        uuid user_id FK
        string rotulo
        string destinatario
        string logradouro
        string numero
        string complemento
        string bairro
        string cidade
        string uf
        string cep
        boolean padrao
    }

    artist {
        uuid id PK
        uuid user_id FK UK
        string slug UK
        text bio
        string avatar_url
        string instagram
    }

    artwork {
        uuid id PK
        uuid artist_id FK
        string titulo
        string slug UK
        text descricao
        string tecnica
        string dimensoes
        int ano
        int preco_centavos
        enum situacao "rascunho disponivel reservada vendida"
        boolean destaque
        string modelo_3d_url
        timestamptz excluido_em
    }

    artwork_image {
        uuid id PK
        uuid artwork_id FK
        string url
        int ordem
        boolean principal
        string texto_alternativo
    }

    tag {
        uuid id PK
        string nome UK
        string slug UK
    }

    artwork_tag {
        uuid artwork_id PK_FK
        uuid tag_id PK_FK
    }

    cart {
        uuid id PK
        uuid user_id FK
        string cookie_token
        timestamptz atualizado_em
    }

    cart_item {
        uuid id PK
        uuid cart_id FK
        uuid artwork_id FK
        timestamptz adicionado_em
    }

    order {
        uuid id PK
        string numero UK
        uuid user_id FK
        enum situacao
        int subtotal_centavos
        int desconto_centavos
        int frete_centavos
        int total_centavos
        jsonb endereco_copia
        string codigo_rastreio
        timestamptz criado_em
        timestamptz pago_em
        timestamptz enviado_em
        timestamptz excluido_em
    }

    order_item {
        uuid id PK
        uuid order_id FK
        uuid artwork_id FK
        string titulo_copia
        int preco_centavos_copia
    }

    payment {
        uuid id PK
        uuid order_id FK
        string provedor
        string id_externo
        enum metodo "pix cartao boleto"
        enum situacao
        int valor_centavos
        jsonb payload
    }

    webhook_event {
        uuid id PK
        string id_evento UK
        string origem
        jsonb payload
        timestamptz processado_em
    }

    artwork_reservation {
        uuid id PK
        uuid artwork_id FK
        uuid session_id FK
        timestamptz expira_em
    }

    tattoo_style {
        uuid id PK
        string nome UK
        string slug UK
        text descricao
    }

    portfolio_item {
        uuid id PK
        uuid artist_id FK
        string imagem_url
        string regiao_corpo
        int duracao_minutos
        boolean destaque
        int ordem
    }

    size_tier {
        uuid id PK
        string nome
        int duracao_minutos
        int preco_base_centavos
        int ordem
    }

    availability_rule {
        uuid id PK
        uuid artist_id FK
        int dia_semana
        time inicio
        time fim
        int duracao_sessao_min
        int intervalo_min
    }

    time_block {
        uuid id PK
        uuid artist_id FK
        timestamptz inicio
        timestamptz fim
        string motivo
        string origem "manual google"
        string google_event_id
    }

    appointment {
        uuid id PK
        string codigo UK
        uuid user_id FK
        uuid artist_id FK
        uuid tattoo_style_id FK
        uuid size_tier_id FK
        enum situacao "pendente aprovada recusada confirmada cancelada concluida"
        timestamptz inicia_em
        timestamptz termina_em
        int duracao_estimada_min
        string regiao_corpo
        text descricao
        int orcamento_centavos
        string google_event_id
        timestamptz aviso_anamnese_em
        timestamptz aviso_termo_em
        timestamptz aviso_maioridade_em
        boolean anamnese_apresentada
        boolean termo_assinado
        boolean identidade_conferida
        timestamptz excluido_em
    }

    appointment_reference {
        uuid id PK
        uuid appointment_id FK
        string imagem_url
        int ordem
    }

    site_setting {
        uuid id PK
        string chave UK
        jsonb valor
    }

    contact_message {
        uuid id PK
        string nome
        string email
        text mensagem
        timestamptz criado_em
    }

    email_log {
        uuid id PK
        uuid user_id FK
        string destinatario
        string template
        enum situacao
        jsonb metadados
        timestamptz enviado_em
    }
```

## Restrições que o diagrama não desenha

| Onde | Regra |
|------|-------|
| `appointment` | `EXCLUDE USING gist (artist_id WITH =, tstzrange(inicia_em, termina_em) WITH &&)` — impede sobreposição na agenda do mesmo artista (RN08) |
| `appointment` | Nasce pendente e só ocupa a agenda de forma definitiva após aprovação do artista (RN10) |
| `appointment` | Só pode ser marcado como concluído após o staff confirmar anamnese, termo e identidade/maioridade (RN12); aceites do wizard e conferências registrados com data e hora (RNF20) |
| `artwork` | Peça única: estoque 1; no máximo uma venda (RN02, RN04) |
| `artwork_reservation` | Reserva de 30 min no checkout; expira sem pagamento aprovado (RN03) |
| `payment` | Pertence sempre a um `order` — não há cobrança de sinal para agendamento (fora de escopo, seção 14) |
| `webhook_event.id_evento` | Único, para o webhook do Mercado Pago ser idempotente (RNF11) |
| `order.endereco_copia` | Endereço congelado no pedido; não é FK viva para `address` |
| `order_item` | Cópia de título e preço no momento da compra |
| `user.excluido_em` | Exclusão LGPD anonimiza o cliente e preserva pedidos pagos (RN19) |

## Entidades isoladas de propósito

- **`verification`** — tokens de uso único do Better Auth (recuperação de senha, RF04); o identificador é o e-mail, sem FK para `user`.
- **`webhook_event`** — log de idempotência do gateway; não precisa de FK para `payment`.
- **`site_setting`** e **`contact_message`** — configuração e formulário de contato, sem dono no modelo.
- **Não existem** `health_form` nem entidade de teor do termo (RN03, RNF19). Também não existem cupom, sala de galeria, sinal de agendamento, log de auditoria, flag de autorização de imagem nem registro de comparecimento — fora de escopo (seção 14 de `ESCOPO-E-STACK.md`).
