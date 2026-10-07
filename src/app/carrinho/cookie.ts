import { cookies } from "next/headers";
import { juntarCarrinhos } from "@/modules/orders";

// Cookie do carrinho do visitante (PBI-24): leva o token; o banco guarda só o hash.
const COOKIE_CARRINHO = "kolo_carrinho";
const TRINTA_DIAS = 60 * 60 * 24 * 30;

export async function lerTokenDoCarrinho(): Promise<string | null> {
  return (await cookies()).get(COOKIE_CARRINHO)?.value ?? null;
}

// Só funciona em Server Action ou Route Handler, onde a resposta pode gravar cookie.
export async function gravarTokenDoCarrinho(token: string): Promise<void> {
  (await cookies()).set(COOKIE_CARRINHO, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TRINTA_DIAS,
  });
}

// Depois do login ou do cadastro: o carrinho do visitante passa para a conta. Se a junção
// falhar, o cookie fica, e o visitante não perde os itens.
export async function juntarCarrinhoDoVisitante(tokenSessao: string): Promise<void> {
  const tokenVisitante = await lerTokenDoCarrinho();
  if (!tokenVisitante) return;
  const resultado = await juntarCarrinhos(tokenSessao, tokenVisitante);
  if (resultado.ok) (await cookies()).delete(COOKIE_CARRINHO);
}
