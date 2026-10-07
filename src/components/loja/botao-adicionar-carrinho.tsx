"use client";

import { useState } from "react";
import { unstable_rethrow, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Resultado = { ok: true } | { ok: false; mensagem: string };

// Pronto para a página da obra (PBI-20): recebe a adicionarAoCarrinhoAcao de
// src/app/carrinho/actions.ts. O refresh atualiza a contagem do cabeçalho.
export function BotaoAdicionarAoCarrinho({
  obraId,
  adicionar,
}: {
  obraId: string;
  adicionar: (obraId: string) => Promise<Resultado>;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState<"ocioso" | "enviando" | "adicionada">("ocioso");
  const [erro, setErro] = useState<string | null>(null);

  async function clicar() {
    setEstado("enviando");
    setErro(null);
    try {
      const resultado = await adicionar(obraId);
      if (resultado.ok) {
        setEstado("adicionada");
        router.refresh();
      } else {
        setEstado("ocioso");
        setErro(resultado.mensagem);
      }
    } catch (falha) {
      unstable_rethrow(falha);
      setEstado("ocioso");
      setErro("Não foi possível adicionar agora. Tente novamente.");
    }
  }

  return (
    <div className="grid gap-2">
      <Button type="button" disabled={estado === "enviando"} onClick={() => void clicar()}>
        {estado === "enviando" ? "Adicionando…" : "Adicionar ao carrinho"}
      </Button>
      {estado === "adicionada" && (
        <p role="status">
          Obra adicionada ao carrinho.{" "}
          <a href="/carrinho" className="text-[var(--kolo-link)] underline underline-offset-4">
            Ver carrinho
          </a>
        </p>
      )}
      {erro && (
        <p role="alert" className="text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
