import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { obterPool } from "../../src/lib/db";
import { usuarioIdDaRequisicao } from "../../src/lib/auth";
import { enderecoDaRequisicao, salvarEndereco } from "../../src/lib/endereco";
import {
  obterEnderecoDoUsuario,
  salvarEnderecoDoUsuario,
} from "../../src/lib/endereco/repositorio";
import { validarEndereco, type EntradaEndereco } from "../../src/modules/endereco";

// A identidade vem da sessão: aqui ela é simulada devolvendo o id escolhido pelo teste.
vi.mock("../../src/lib/auth", () => ({ usuarioIdDaRequisicao: vi.fn() }));

const enderecoA: EntradaEndereco = {
  destinatario: "Ana Alves",
  cep: "01310-100",
  logradouro: "Avenida Paulista",
  numero: "1000",
  complemento: "Apto 12",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "SP",
};

const enderecoB: EntradaEndereco = {
  destinatario: "Bruno Bastos",
  cep: "20040-020",
  logradouro: "Rua da Assembleia",
  numero: "10",
  complemento: "",
  bairro: "Centro",
  cidade: "Rio de Janeiro",
  uf: "RJ",
};

const criados: string[] = [];

async function criarUsuario(nome: string): Promise<string> {
  const id = randomUUID();
  // atualizado_em não tem DEFAULT no banco (o Prisma preenche no cliente).
  await obterPool().query(
    `INSERT INTO "user" (id, papel, nome, email, telefone, atualizado_em)
     VALUES ($1, 'CLIENTE', $2, $3, '11999999999', now())`,
    [id, nome, `${id}@endereco.test`],
  );
  criados.push(id);
  return id;
}

function dadosValidos(entrada: EntradaEndereco) {
  const validacao = validarEndereco(entrada);
  if (!validacao.ok) throw new Error("Endereço de teste inválido");
  return validacao.dados;
}

async function contarEnderecos(userId: string): Promise<number> {
  const { rows } = await obterPool().query<{ total: string }>(
    "SELECT count(*) AS total FROM address WHERE user_id = $1",
    [userId],
  );
  return Number(rows[0]?.total);
}

beforeEach(() => {
  vi.mocked(usuarioIdDaRequisicao).mockReset();
});

afterEach(async () => {
  // address.user_id tem ON DELETE CASCADE: apagar o usuário apaga o endereço.
  if (criados.length > 0) {
    await obterPool().query(`DELETE FROM "user" WHERE id = ANY($1::uuid[])`, [criados]);
    criados.length = 0;
  }
});

describe("persistência do endereço", () => {
  it("devolve null para quem ainda não cadastrou endereço", async () => {
    const userId = await criarUsuario("Sem endereço");
    expect(await obterEnderecoDoUsuario(userId)).toBeNull();
  });

  it("grava e lê o endereço do usuário", async () => {
    const userId = await criarUsuario("Ana");
    await salvarEnderecoDoUsuario(userId, dadosValidos(enderecoA));
    expect(await obterEnderecoDoUsuario(userId)).toEqual(enderecoA);
  });

  it("guarda complemento vazio como nulo e devolve texto vazio", async () => {
    const userId = await criarUsuario("Bruno");
    await salvarEnderecoDoUsuario(userId, dadosValidos(enderecoB));
    const { rows } = await obterPool().query<{ complemento: string | null }>(
      "SELECT complemento FROM address WHERE user_id = $1",
      [userId],
    );
    expect(rows[0]?.complemento).toBeNull();
    expect(await obterEnderecoDoUsuario(userId)).toEqual(enderecoB);
  });
});

describe("atualização do endereço", () => {
  it("mantém um único endereço por usuário ao salvar de novo", async () => {
    const userId = await criarUsuario("Ana");
    await salvarEnderecoDoUsuario(userId, dadosValidos(enderecoA));
    await salvarEnderecoDoUsuario(userId, dadosValidos({ ...enderecoA, numero: "2000", uf: "RJ" }));
    expect(await contarEnderecos(userId)).toBe(1);
    expect(await obterEnderecoDoUsuario(userId)).toEqual({
      ...enderecoA,
      numero: "2000",
      uf: "RJ",
    });
  });

  it("permite remover o complemento ao atualizar", async () => {
    const userId = await criarUsuario("Ana");
    await salvarEnderecoDoUsuario(userId, dadosValidos(enderecoA));
    await salvarEnderecoDoUsuario(userId, dadosValidos({ ...enderecoA, complemento: "" }));
    expect((await obterEnderecoDoUsuario(userId))?.complemento).toBe("");
  });

  it("o banco impede dois endereços para o mesmo usuário", async () => {
    const userId = await criarUsuario("Ana");
    await salvarEnderecoDoUsuario(userId, dadosValidos(enderecoA));
    await expect(
      obterPool().query(
        `INSERT INTO address (id, user_id, destinatario, logradouro, numero, bairro, cidade, uf, cep)
         VALUES ($1, $2, 'X', 'Y', '1', 'Z', 'W', 'SP', '01310-100')`,
        [randomUUID(), userId],
      ),
    ).rejects.toThrow();
  });
});

describe("isolamento entre usuários", () => {
  it("cada usuário só enxerga o próprio endereço", async () => {
    const a = await criarUsuario("Ana");
    const b = await criarUsuario("Bruno");
    await salvarEnderecoDoUsuario(a, dadosValidos(enderecoA));
    await salvarEnderecoDoUsuario(b, dadosValidos(enderecoB));
    expect(await obterEnderecoDoUsuario(a)).toEqual(enderecoA);
    expect(await obterEnderecoDoUsuario(b)).toEqual(enderecoB);
  });

  it("atualizar o endereço de um usuário não altera o do outro", async () => {
    const a = await criarUsuario("Ana");
    const b = await criarUsuario("Bruno");
    await salvarEnderecoDoUsuario(a, dadosValidos(enderecoA));
    await salvarEnderecoDoUsuario(b, dadosValidos(enderecoB));
    await salvarEnderecoDoUsuario(a, dadosValidos({ ...enderecoA, cidade: "Campinas" }));
    expect(await obterEnderecoDoUsuario(b)).toEqual(enderecoB);
    expect((await obterEnderecoDoUsuario(a))?.cidade).toBe("Campinas");
  });

  it("a leitura pela requisição devolve só o endereço do usuário da sessão", async () => {
    const a = await criarUsuario("Ana");
    const b = await criarUsuario("Bruno");
    await salvarEnderecoDoUsuario(a, dadosValidos(enderecoA));
    await salvarEnderecoDoUsuario(b, dadosValidos(enderecoB));
    vi.mocked(usuarioIdDaRequisicao).mockResolvedValue(b);
    expect(await enderecoDaRequisicao(new Headers())).toEqual(enderecoB);
  });

  it("um userId enviado no formulário é ignorado: grava no dono da sessão", async () => {
    const a = await criarUsuario("Ana");
    const b = await criarUsuario("Bruno");
    vi.mocked(usuarioIdDaRequisicao).mockResolvedValue(a);
    const adulterada = { ...enderecoA, userId: b } as EntradaEndereco;
    expect(await salvarEndereco(adulterada, new Headers())).toEqual({ ok: true });
    expect(await obterEnderecoDoUsuario(a)).toEqual(enderecoA);
    expect(await obterEnderecoDoUsuario(b)).toBeNull();
  });

  it("sem sessão não lê nem grava nada", async () => {
    const a = await criarUsuario("Ana");
    await salvarEnderecoDoUsuario(a, dadosValidos(enderecoA));
    vi.mocked(usuarioIdDaRequisicao).mockResolvedValue(null);
    expect(await enderecoDaRequisicao(new Headers())).toBeNull();
    expect(await salvarEndereco(enderecoB, new Headers())).toEqual({
      ok: false,
      erro: "nao_autenticado",
    });
    expect(await obterEnderecoDoUsuario(a)).toEqual(enderecoA);
  });

  it("entrada inválida é rejeitada no servidor e não grava", async () => {
    const a = await criarUsuario("Ana");
    vi.mocked(usuarioIdDaRequisicao).mockResolvedValue(a);
    const resultado = await salvarEndereco({ ...enderecoA, cep: "123", uf: "XX" }, new Headers());
    expect(resultado).toMatchObject({ ok: false, erro: "invalido" });
    expect(await obterEnderecoDoUsuario(a)).toBeNull();
  });
});