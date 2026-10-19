"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

// RF32 (PBI-48): imprime a página (ou salva em PDF pelo navegador); o próprio botão não sai no papel.
export function BotaoImprimir() {
  return (
    <Button
      type="button"
      variant="contorno"
      className="print:hidden"
      onClick={() => window.print()}
    >
      <Printer aria-hidden />
      Imprimir
    </Button>
  );
}
