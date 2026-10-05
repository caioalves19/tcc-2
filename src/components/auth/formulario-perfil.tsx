"use client";

import { useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { useForm } from "react-hook-form";
import { AvisoErro, Campo } from "@/components/auth/campo";
import { resolverDe } from "@/components/auth/resolver";
import { Button } from "@/components/ui/button";
import {
  validarPerfil,
  type DadosPerfil,
  type EntradaPerfil,
  type ResultadoPerfil,
} from "@/modules/identity";

const resolver = resolverDe(validarPerfil);
export function FormularioPerfil({
  dados,
  acao,
}: {
  dados: DadosPerfil;
  acao: (entrada: EntradaPerfil) => Promise<ResultadoPerfil>;
}) {
  const [sucesso, setSucesso] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EntradaPerfil, unknown, DadosPerfil>({ resolver, defaultValues: dados });
  async function enviar(entrada: DadosPerfil) {
    try {
      const resultado = await acao(entrada);
      if (resultado.ok) {
        reset(entrada);
        setSucesso(true);
      } else if (resultado.erro === "invalido") {
        for (const [campo, mensagem] of Object.entries(resultado.campos))
          setError(campo as keyof DadosPerfil, { message: mensagem });
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
        id="nome"
        rotulo="Nome"
        tipo="text"
        autoComplete="name"
        registro={register("nome")}
        erro={errors.nome?.message}
      />
      <Campo
        id="telefone"
        rotulo="Telefone"
        tipo="tel"
        autoComplete="tel"
        registro={register("telefone")}
        erro={errors.telefone?.message}
      />
      <AvisoErro mensagem={errors.root?.servidor?.message} />
      {sucesso && (
        <p role="status" className="text-corpo">
          Dados atualizados com sucesso.
        </p>
      )}
      <Button type="submit" disabled={isSubmitting}>
        Salvar dados
      </Button>
    </form>
  );
}
