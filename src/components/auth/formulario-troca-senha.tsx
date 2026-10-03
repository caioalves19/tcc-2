"use client";

import { useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { useForm } from "react-hook-form";
import { AvisoErro, Campo } from "@/components/auth/campo";
import { resolverDe } from "@/components/auth/resolver";
import { Button } from "@/components/ui/button";
import {
  validarTrocaSenha,
  type DadosTrocaSenha,
  type EntradaTrocaSenha,
  type ResultadoTrocaSenha,
} from "@/modules/identity";

const resolver = resolverDe(validarTrocaSenha);
export function FormularioTrocaSenha({
  acao,
}: {
  acao: (entrada: EntradaTrocaSenha) => Promise<ResultadoTrocaSenha>;
}) {
  const [sucesso, setSucesso] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EntradaTrocaSenha, unknown, DadosTrocaSenha>({
    resolver,
    defaultValues: { senhaAtual: "", senha: "", confirmacao: "" },
  });
  async function enviar(entrada: DadosTrocaSenha) {
    try {
      const resultado = await acao(entrada);
      if (resultado.ok) {
        reset();
        setSucesso(true);
      } else if (resultado.erro === "invalido") {
        for (const [campo, mensagem] of Object.entries(resultado.campos))
          setError(campo as keyof DadosTrocaSenha, { message: mensagem });
      } else if (resultado.erro === "senha_atual_incorreta") {
        setError("senhaAtual", { message: "Senha atual incorreta." });
      } else {
        setError("root.servidor", {
          message: "Sua sessão expirou. Entre novamente para continuar.",
        });
      }
    } catch (erro) {
      unstable_rethrow(erro);
      setError("root.servidor", { message: "Não foi possível salvar agora. Tente de novo." });
    }
  }
  return (
    <form
      noValidate
      onChange={() => setSucesso(false)}
      onSubmit={(evento) => {
        setSucesso(false);
        void handleSubmit(enviar)(evento);
      }}
      className="grid gap-5"
    >
      <Campo
        id="senhaAtual"
        rotulo="Senha atual"
        tipo="password"
        autoComplete="current-password"
        registro={register("senhaAtual")}
        erro={errors.senhaAtual?.message}
      />
      <Campo
        id="senha"
        rotulo="Nova senha"
        tipo="password"
        autoComplete="new-password"
        registro={register("senha")}
        erro={errors.senha?.message}
      />
      <Campo
        id="confirmacao"
        rotulo="Confirme a nova senha"
        tipo="password"
        autoComplete="new-password"
        registro={register("confirmacao")}
        erro={errors.confirmacao?.message}
      />
      <AvisoErro mensagem={errors.root?.servidor?.message} />
      {sucesso && (
        <p role="status" className="text-corpo">
          Senha alterada com sucesso.
        </p>
      )}
      <Button type="submit" disabled={isSubmitting}>
        Alterar senha
      </Button>
    </form>
  );
}
