"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

// RF16: código de rastreio com botão de copiar. Sem link para transportadora: o pedido não
// guarda qual é (as modalidades de frete são do PBI-42).
export function CopiarCodigo({ codigo }: { codigo: string }) {
  const [mensagem, setMensagem] = useState("");

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setMensagem("Código copiado.");
    } catch {
      setMensagem("Não foi possível copiar. Selecione o código e copie.");
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <code className="select-all break-all rounded-campo border-2 border-neutro-grafite bg-[var(--kolo-superficie)] px-3 py-2 font-display text-titulo-lg text-[var(--kolo-superficie-texto)]">
          {codigo}
        </code>
        <Button
          type="button"
          variant="contorno"
          onClick={copiar}
          aria-label="Copiar código de rastreio"
        >
          <Copy aria-hidden />
          Copiar
        </Button>
      </div>
      <p role="status" className="text-nota">
        {mensagem}
      </p>
    </div>
  );
}
