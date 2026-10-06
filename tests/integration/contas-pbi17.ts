import type { Client } from "pg";
import { prepararBancoDeTeste } from "./banco-de-teste";

export const SENHA = "senha-inicial-123";

export async function comCookie(token: string) {
  const { makeSignature } = await import("better-auth/crypto");
  const assinatura = await makeSignature(token, process.env.BETTER_AUTH_SECRET ?? "");
  return new Headers({
    cookie: `better-auth.session_token=${encodeURIComponent(`${token}.${assinatura}`)}`,
  });
}

export type Contas = {
  db: Client;
  admin: Headers;
  cliente: Headers;
  ana: Headers;
  bia: Headers;
  idAna: string;
  idBia: string;
};

// Banco descartável com um ADMIN, um CLIENTE e dois ARTISTAs (Ana e Bia) já com sessão.
export async function prepararContas(nomeBanco: string): Promise<Contas> {
  const db = await prepararBancoDeTeste(nomeBanco);
  const { cadastrarCliente, abrirSessao } = await import("../../src/lib/auth");
  const { criarArtista } = await import("../../src/modules/artists");

  async function cadastrar(email: string) {
    const resultado = await cadastrarCliente({
      nome: "Pessoa",
      email,
      telefone: "11987654321",
      senha: SENHA,
    });
    if (!resultado.ok) throw new Error("Falha ao preparar usuário");
    return comCookie(resultado.token);
  }
  const admin = await cadastrar("admin@pbi17.test");
  const cliente = await cadastrar("cliente@pbi17.test");
  await db.query("UPDATE \"user\" SET papel = 'ADMIN' WHERE email = $1", ["admin@pbi17.test"]);

  for (const [slug, nome] of [
    ["ana", "Ana"],
    ["bia", "Bia"],
  ]) {
    const criado = await criarArtista(
      {
        modo: "novo",
        nome,
        email: `${slug}@pbi17.test`,
        telefone: "11987654321",
        senha: SENHA,
        slug,
        estilos: [],
      },
      admin,
    );
    if (!criado.ok) throw new Error(criado.mensagem);
  }
  const ids = await db.query("SELECT id, slug FROM artist");
  const idAna: string = ids.rows.find((r) => r.slug === "ana").id;
  const idBia: string = ids.rows.find((r) => r.slug === "bia").id;
  const ana = await comCookie((await abrirSessao({ email: "ana@pbi17.test", senha: SENHA })).token);
  const bia = await comCookie((await abrirSessao({ email: "bia@pbi17.test", senha: SENHA })).token);
  return { db, admin, cliente, ana, bia, idAna, idBia };
}
