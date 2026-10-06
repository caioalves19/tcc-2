"use server";

import { headers } from "next/headers";
import { revisarPreferenciaWizard } from "@/modules/scheduling";

export async function revisarPreferenciaAcao(entrada: unknown) {
  return revisarPreferenciaWizard(entrada, await headers());
}
