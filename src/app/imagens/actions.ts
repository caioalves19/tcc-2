"use server";

import { headers } from "next/headers";
import { processarImagem, solicitarUpload } from "@/modules/media";
import type { EntradaUpload } from "@/modules/media";

export async function solicitarUploadAcao(entrada: EntradaUpload) {
  return solicitarUpload(entrada, await headers());
}

export async function processarImagemAcao(chave: string) {
  return processarImagem(chave, await headers());
}
