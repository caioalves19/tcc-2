"use client";

import { unstable_rethrow } from "next/navigation";
import { useForm } from "react-hook-form";

import { AvisoErro, Campo } from "@/components/auth/campo";
import { resolverDe } from "@/components/auth/resolver";
import { Button } from "@/components/ui/button";
import {
  mensagemFalhaLogin,
  validarLogin,
  type DadosLogin,
  type EntradaLogin,
  type FalhaLogin,
} from "@/modules/identity";

const resolver = resolverDe(validarLogin);

export function FormularioLogin({
  acao,
}: {
  acao: (entrada: EntradaLogin) => Promise<FalhaLogin | undefined>;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EntradaLogin, unknown, DadosLogin>({ resolver });

  async function enviar(dados: DadosLogin) {
    let falha: FalhaLogin | undefined;
    try {
      falha = await acao(dados);
    } catch (erro) {
      // O redirect de sucesso chega aqui como erro interno do Next: precisa seguir adiante.
      unstable_rethrow(erro);
      setError("root.servidor", { message: "Não foi possível entrar agora. Tente de novo." });
      return;
    }
    if (falha !== undefined) {
      setError("root.servidor", { message: mensagemFalhaLogin(falha) });
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(enviar)} className="grid gap-5">
      <Campo
        id="email"
        rotulo="E-mail"
        tipo="email"
        autoComplete="email"
        erro={errors.email?.message}
        registro={register("email")}
      />
      <Campo
        id="senha"
        rotulo="Senha"
        tipo="password"
        autoComplete="current-password"
        erro={errors.senha?.message}
        registro={register("senha")}
      />
      <AvisoErro mensagem={errors.root?.servidor?.message} />
      <Button type="submit" disabled={isSubmitting}>
        Entrar
      </Button>
    </form>
  );
}
