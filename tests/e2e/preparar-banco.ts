// Recria o banco kolo_e2e (migrações + dados fixos de tests/e2e/dados.ts) antes do servidor do
// E2E subir. Roda dentro do comando do webServer, então termina antes do `next start`.
import { mkdirSync, rmSync } from "node:fs";
import { basename } from "node:path";

import { hashPassword } from "better-auth/crypto";
import type { Client } from "pg";

import { prepararBancoDeTeste } from "../integration/banco-de-teste";
import {
  ADMIN,
  ARTISTA,
  BANCO_E2E,
  CLIENTE,
  ESTILOS,
  HORARIO,
  OBRA,
  OBRA_CARRINHO,
  OBRA_VENDIDA,
  OUTRO_ARTISTA,
  PEDIDO_PAGO,
  TAMANHOS,
  TRABALHO_DA_ARTISTA,
  WHATSAPP_E2E,
} from "./dados";

// RF06: conta com credencial do Better Auth (mesmo formato do prisma/seed.ts).
async function conta(
  db: Client,
  usuario: { userId: string; nome: string; email: string },
  papel: "ADMIN" | "ARTISTA" | "CLIENTE",
  senhaHash: string,
): Promise<void> {
  await db.query(
    `INSERT INTO "user" (id, papel, nome, email, situacao, atualizado_em)
     VALUES ($1, $2, $3, $4, 'ATIVO', now())`,
    [usuario.userId, papel, usuario.nome, usuario.email],
  );
  await db.query(
    `INSERT INTO account (id, user_id, provedor, id_externo, senha_hash, atualizado_em)
     VALUES (gen_random_uuid(), $1, 'credential', $2, $3, now())`,
    [usuario.userId, usuario.userId, senhaHash],
  );
}

async function obra(
  db: Client,
  dados: { id: string; titulo: string; slug: string; precoCentavos: number },
  estoque: number,
  situacao: "DISPONIVEL" | "ESGOTADA",
): Promise<void> {
  await db.query(
    `INSERT INTO artwork (id, artist_id, titulo, slug, preco_centavos, quantidade_estoque, situacao)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [dados.id, ARTISTA.id, dados.titulo, dados.slug, dados.precoCentavos, estoque, situacao],
  );
}

// RNF20/RNF21: o que as telas do cliente e da equipe precisam para não abrirem vazias: a Clara
// com endereço, uma obra no carrinho, um pedido pago (item e pagamento) e um horário na agenda.
async function dadosDaVarredura(db: Client, senhaHash: string): Promise<void> {
  await conta(db, CLIENTE, "CLIENTE", senhaHash);
  const endereco = {
    destinatario: CLIENTE.nome,
    cep: "01310100",
    logradouro: "Avenida Paulista",
    numero: "1000",
    complemento: "",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    uf: "SP",
  };
  await db.query(
    `INSERT INTO address (id, user_id, destinatario, logradouro, numero, bairro, cidade, uf, cep)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      CLIENTE.userId,
      endereco.destinatario,
      endereco.logradouro,
      endereco.numero,
      endereco.bairro,
      endereco.cidade,
      endereco.uf,
      endereco.cep,
    ],
  );

  await obra(db, OBRA_CARRINHO, 1, "DISPONIVEL");
  await obra(db, OBRA_VENDIDA, 0, "ESGOTADA");
  const carrinho = await db.query<{ id: string }>(
    `INSERT INTO cart (id, user_id, atualizado_em) VALUES (gen_random_uuid(), $1, now()) RETURNING id`,
    [CLIENTE.userId],
  );
  await db.query(
    `INSERT INTO cart_item (id, cart_id, artwork_id, quantidade) VALUES (gen_random_uuid(), $1, $2, 1)`,
    [carrinho.rows[0]?.id, OBRA_CARRINHO.id],
  );

  await db.query(
    `INSERT INTO "order" (id, numero, user_id, modalidade_entrega, situacao, subtotal_centavos,
       total_centavos, endereco_copia, pago_em)
     VALUES ($1, $2, $3, 'RETIRADA', 'PAGO', $4, $4, $5, now())`,
    [
      PEDIDO_PAGO.id,
      PEDIDO_PAGO.numero,
      CLIENTE.userId,
      OBRA_VENDIDA.precoCentavos,
      JSON.stringify(endereco),
    ],
  );
  await db.query(
    `INSERT INTO order_item (id, order_id, artwork_id, titulo_copia, preco_centavos_copia, quantidade)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, 1)`,
    [PEDIDO_PAGO.id, OBRA_VENDIDA.id, OBRA_VENDIDA.titulo, OBRA_VENDIDA.precoCentavos],
  );
  await db.query(
    `INSERT INTO payment (id, order_id, provedor, id_externo, metodo, situacao, valor_centavos)
     VALUES (gen_random_uuid(), $1, 'mercado_pago', '9000099', 'PIX', 'APROVADO', $2)`,
    [PEDIDO_PAGO.id, OBRA_VENDIDA.precoCentavos],
  );

  // Amanhã às 14h em São Paulo (17h UTC), três horas.
  const amanha = new Date();
  amanha.setUTCDate(amanha.getUTCDate() + 1);
  amanha.setUTCHours(17, 0, 0, 0);
  await db.query(
    `INSERT INTO appointment (id, codigo, nome_contato, telefone_contato, artist_id, inicia_em,
       termina_em, regiao_corpo)
     VALUES ($1, $2, 'Lucas Silveira', '11987654321', $3, $4, $5, 'Antebraço')`,
    [
      HORARIO.id,
      HORARIO.codigo,
      ARTISTA.id,
      amanha.toISOString(),
      new Date(amanha.getTime() + 3 * 60 * 60 * 1000).toISOString(),
    ],
  );
}

async function preparar(): Promise<void> {
  const senha = process.env.E2E_SENHA_EQUIPE;
  if (!senha) throw new Error("E2E_SENHA_EQUIPE ausente: rode pelo npm run test:e2e.");
  const senhaHash = await hashPassword(senha);
  // RF27: o "bucket" do E2E começa vazio a cada rodada.
  const pastaR2 = process.env.E2E_R2_DIR;
  if (!pastaR2) throw new Error("E2E_R2_DIR ausente: rode pelo npm run test:e2e.");
  // A pasta é apagada inteira: só aceita a do E2E, nunca outra que venha do ambiente.
  if (basename(pastaR2) !== "kolo-e2e-r2")
    throw new Error(`E2E_R2_DIR precisa terminar em kolo-e2e-r2: ${pastaR2}`);
  rmSync(pastaR2, { recursive: true, force: true });
  mkdirSync(pastaR2, { recursive: true });
  const db = await prepararBancoDeTeste(BANCO_E2E);
  try {
    await conta(db, ADMIN, "ADMIN", senhaHash);
    for (const artista of [ARTISTA, OUTRO_ARTISTA]) {
      await conta(db, artista, "ARTISTA", senhaHash);
      await db.query(`INSERT INTO artist (id, user_id, slug) VALUES ($1, $2, $3)`, [
        artista.id,
        artista.userId,
        artista.slug,
      ]);
    }
    // RN10: um trabalho de cada artista. O do outro a Bia não pode ver na gestão dela; o dela
    // garante que a lista (e seus botões) exista na varredura, rode o E2E do portfólio antes ou não.
    for (const [artistaId, trabalho] of [
      [OUTRO_ARTISTA.id, OUTRO_ARTISTA.trabalho],
      [ARTISTA.id, TRABALHO_DA_ARTISTA],
    ] as const) {
      await db.query(
        `INSERT INTO portfolio_item (id, artist_id, titulo, imagem_url, ordem) VALUES ($1, $2, $3, $4, 1)`,
        [trabalho.id, artistaId, trabalho.titulo, `portfolio/${artistaId}/fixture.jpg`],
      );
    }
    for (const estilo of ESTILOS) {
      await db.query(`INSERT INTO tattoo_style (id, nome, slug) VALUES ($1, $2, $3)`, [
        estilo.id,
        estilo.nome,
        estilo.slug,
      ]);
      await db.query(`INSERT INTO artist_style (artist_id, tattoo_style_id) VALUES ($1, $2)`, [
        ARTISTA.id,
        estilo.id,
      ]);
    }
    for (const tamanho of TAMANHOS) {
      await db.query(`INSERT INTO size_tier (id, nome, ordem) VALUES ($1, $2, $3)`, [
        tamanho.id,
        tamanho.nome,
        tamanho.ordem,
      ]);
    }
    // RF26/RN02: a obra que o E2E da compra leva, Disponível e com uma unidade.
    await obra(db, OBRA, 1, "DISPONIVEL");
    await dadosDaVarredura(db, senhaHash);
    // RF31: o WhatsApp que o wizard usa vem das configurações do site.
    await db.query(
      `INSERT INTO site_setting (id, chave, valor) VALUES (gen_random_uuid(), $1, $2)`,
      [
        "contato",
        JSON.stringify({
          email: "contato@kolo.test",
          whatsapp: WHATSAPP_E2E,
          instagramAtelie: "koloatelie",
          instagramTattoo: "kolotattoo",
        }),
      ],
    );
  } finally {
    await db.end();
  }
}

await preparar();
