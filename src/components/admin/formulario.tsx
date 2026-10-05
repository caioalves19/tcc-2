"use client";

import { useState, type ReactNode } from "react";
import { unstable_rethrow, useRouter } from "next/navigation";
import type { ResultadoGestao } from "@/modules/artists";

export const classeCampo =
  "w-full rounded-campo border-2 border-[var(--kolo-contorno)] bg-transparent px-3 py-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
export function CampoAdmin({
  nome,
  rotulo,
  valor = "",
  tipo = "text",
  obrigatorio = false,
  longo = false,
}: {
  nome: string;
  rotulo: string;
  valor?: string | null;
  tipo?: string;
  obrigatorio?: boolean;
  longo?: boolean;
}) {
  const props = {
    id: nome,
    name: nome,
    defaultValue: valor ?? "",
    required: obrigatorio,
    className: classeCampo,
  };
  return (
    <div className="grid gap-2">
      <label htmlFor={nome} className="text-nota font-semibold">
        {rotulo}
      </label>
      {longo ? (
        <textarea {...props} rows={4} />
      ) : (
        <input
          {...props}
          type={tipo}
          autoComplete={tipo === "password" ? "new-password" : undefined}
        />
      )}
    </div>
  );
}
export function texto(dados: FormData, campo: string): string {
  const valor = dados.get(campo);
  return typeof valor === "string" ? valor : "";
}

export function useGestao() {
  const router = useRouter();
  const [pendente, setPendente] = useState(false);
  const [aviso, setAviso] = useState<{ erro: boolean; mensagem: string } | null>(null);
  async function executar(
    acao: () => Promise<ResultadoGestao<unknown>>,
    sucesso: () => void,
    mensagem: string,
  ) {
    setPendente(true);
    setAviso(null);
    try {
      const resultado = await acao();
      if (!resultado.ok) setAviso({ erro: true, mensagem: resultado.mensagem });
      else {
        sucesso();
        router.refresh();
        setAviso({ erro: false, mensagem });
      }
    } catch (erro) {
      unstable_rethrow(erro);
      setAviso({ erro: true, mensagem: "Não foi possível concluir agora. Tente novamente." });
    } finally {
      setPendente(false);
    }
  }
  const feedback = aviso ? (
    <p
      role={aviso.erro ? "alert" : "status"}
      className={aviso.erro ? "text-destructive" : "text-corpo"}
    >
      {aviso.mensagem}
    </p>
  ) : null;
  return { pendente, executar, feedback, limpar: () => setAviso(null) };
}
export function FormularioAdmin({
  children,
  pendente,
  enviar,
}: {
  children: ReactNode;
  pendente: boolean;
  enviar: (dados: FormData, form: HTMLFormElement) => void;
}) {
  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        const form = evento.currentTarget;
        enviar(new FormData(form), form);
      }}
    >
      <fieldset disabled={pendente} className="grid gap-4">
        {children}
      </fieldset>
    </form>
  );
}
