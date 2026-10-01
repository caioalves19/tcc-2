"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { AvisoErro, Campo } from "@/components/auth/campo";
import { resolverDe } from "@/components/auth/resolver";
import { Button } from "@/components/ui/button";
import {
  MENSAGEM_PEDIDO_RECUPERACAO,
  validarPedidoRecuperacao,
  type DadosPedidoRecuperacao,
  type EntradaPedidoRecuperacao,
  type ResultadoPedidoRecuperacao,
} from "@/modules/identity";

const resolver = resolverDe(validarPedidoRecuperacao);

export function FormularioPedidoRecuperacao({
  acao,
}: {
  acao: (entrada: EntradaPedidoRecuperacao) => Promise<ResultadoPedidoRecuperacao>;
}) {
  const [enviado, setEnviado] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EntradaPedidoRecuperacao, unknown, DadosPedidoRecuperacao>({ resolver });

  async function enviar(dados: DadosPedidoRecuperacao) {
    let resultado: ResultadoPedidoRecuperacao;
    try {
      resultado = await acao(dados);
    } catch {
      setError("root.servidor", { message: "Não foi possível enviar agora. Tente de novo." });
      return;
    }
    if (resultado.ok) {
      setEnviado(true);
      return;
    }
    if (resultado.campos.email !== undefined) {
      setError("email", { message: resultado.campos.email });
    }
  }

  if (enviado) {
    return (
      <p role="status" className="rounded-campo border-2 border-[var(--kolo-contorno)] p-4">
        {MENSAGEM_PEDIDO_RECUPERACAO}
      </p>
    );
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
      <AvisoErro mensagem={errors.root?.servidor?.message} />
      <Button type="submit" disabled={isSubmitting}>
        Enviar link
      </Button>
    </form>
  );
}
