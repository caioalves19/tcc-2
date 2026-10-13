"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { salvarConfiguracao } from "@/modules/settings";

// RF31 (PBI-39): o módulo confere sessão e papel e valida tudo. Contato e textos aparecem no
// rodapé e em várias páginas, então o site inteiro é atualizado.
export async function salvarConfiguracaoAcao(entrada: unknown) {
  const resultado = await salvarConfiguracao(entrada, await headers());
  if (resultado.ok) revalidatePath("/", "layout");
  return resultado;
}
