"use client";

import { unstable_rethrow } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { AvisoErro, Campo } from "@/components/auth/campo";
import { resolverDe } from "@/components/auth/resolver";
import { Button } from "@/components/ui/button";
import {
  MENSAGEM_TOKEN_INVALIDO,
  validarRedefinicao,
  type DadosRedefinicao,
  type EntradaRedefinicao,
  type FalhaRedefinicao,
} from "@/modules/identity";

const resolver = resolverDe(validarRedefinicao);

// O tsconfig não inclui a lib "dom": tipamos só o pedaço do History que este arquivo usa.
declare const window: {
  history: { replaceState(estado: null, titulo: string, url: string): void };
};

export function AvisoLinkInvalido({ mensagem = MENSAGEM_TOKEN_INVALIDO }: { mensagem?: string }) {
  return (
    <p role="alert" className="text-nota text-destructive">
      {mensagem}{" "}
      <a href="/esqueci-senha" className="text-[var(--kolo-link)] underline underline-offset-4">
        Pedir novo link
      </a>
    </p>
  );
}

export function FormularioRedefinicao({
  token,
  acao,
}: {
  token: string;
  acao: (entrada: EntradaRedefinicao & { token: string }) => Promise<FalhaRedefinicao | undefined>;
}) {
  const [linkInvalido, setLinkInvalido] = useState(false);

  // O token já está no estado: some da barra de endereço (histórico, POST da action, logs).
  useEffect(() => {
    window.history.replaceState(null, "", "/redefinir-senha");
  }, []);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EntradaRedefinicao, unknown, DadosRedefinicao>({ resolver });

  async function enviar(dados: DadosRedefinicao) {
    let falha: FalhaRedefinicao | undefined;
    try {
      falha = await acao({ token, ...dados });
    } catch (erro) {
      // O redirect de sucesso chega aqui como erro interno do Next: precisa seguir adiante.
      unstable_rethrow(erro);
      setError("root.servidor", { message: "Não foi possível salvar agora. Tente de novo." });
      return;
    }
    if (falha?.erro === "token_invalido") {
      setLinkInvalido(true);
    } else if (falha?.erro === "invalido") {
      for (const [campo, mensagem] of Object.entries(falha.campos)) {
        setError(campo as keyof DadosRedefinicao, { message: mensagem });
      }
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(enviar)} className="grid gap-5">
      <Campo
        id="senha"
        rotulo="Nova senha"
        tipo="password"
        autoComplete="new-password"
        erro={errors.senha?.message}
        registro={register("senha")}
      />
      <Campo
        id="confirmacao"
        rotulo="Confirme a nova senha"
        tipo="password"
        autoComplete="new-password"
        erro={errors.confirmacao?.message}
        registro={register("confirmacao")}
      />
      {linkInvalido && <AvisoLinkInvalido />}
      <AvisoErro mensagem={errors.root?.servidor?.message} />
      <Button type="submit" disabled={isSubmitting}>
        Salvar nova senha
      </Button>
    </form>
  );
}
