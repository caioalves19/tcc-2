"use client";

import { unstable_rethrow } from "next/navigation";
import { useForm } from "react-hook-form";
import { AvisoErro, Campo } from "@/components/auth/campo";
import { resolverDe } from "@/components/auth/resolver";
import { Button } from "@/components/ui/button";
import type { ResultadoExclusao } from "@/modules/customers";
import { validarExclusaoConta, type DadosExclusaoConta } from "@/modules/identity";

// RN12 (PBI-40): a confirmação explícita é a senha atual mais a caixa marcada. Com sucesso, a ação
// do servidor apaga o cookie e leva para a home; aqui só aparecem as recusas.
type CamposExclusao = { senha: string; confirmo: boolean };

const resolver = resolverDe<CamposExclusao, DadosExclusaoConta>(validarExclusaoConta);

export function FormularioExclusaoConta({
  acao,
}: {
  acao: (entrada: DadosExclusaoConta) => Promise<ResultadoExclusao>;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CamposExclusao, unknown, DadosExclusaoConta>({
    resolver,
    defaultValues: { senha: "", confirmo: false },
  });
  async function enviar(entrada: DadosExclusaoConta) {
    try {
      const resultado = await acao(entrada);
      if (resultado.ok) return;
      if (resultado.erro === "invalido") {
        for (const [campo, mensagem] of Object.entries(resultado.campos))
          setError(campo as keyof CamposExclusao, { message: mensagem });
      } else if (resultado.erro === "senha_incorreta") {
        setError("senha", { message: resultado.mensagem });
      } else {
        setError("root.servidor", { message: resultado.mensagem });
      }
    } catch (erro) {
      unstable_rethrow(erro);
      setError("root.servidor", { message: "Não foi possível excluir agora. Tente de novo." });
    }
  }
  const erroConfirmo = errors.confirmo?.message;
  return (
    <form
      noValidate
      onSubmit={(evento) => void handleSubmit(enviar)(evento)}
      className="grid gap-5"
    >
      <Campo
        id="senhaExclusao"
        rotulo="Senha atual"
        tipo="password"
        autoComplete="current-password"
        registro={register("senha")}
        erro={errors.senha?.message}
      />
      <div className="grid gap-2">
        <label className="flex items-start gap-3 text-corpo">
          <input
            type="checkbox"
            className="mt-1 size-5 shrink-0"
            aria-invalid={erroConfirmo !== undefined}
            aria-describedby={erroConfirmo !== undefined ? "confirmo-erro" : undefined}
            {...register("confirmo")}
          />
          Entendo que a exclusão não pode ser desfeita.
        </label>
        {erroConfirmo !== undefined && (
          <p id="confirmo-erro" role="alert" className="text-nota text-destructive">
            {erroConfirmo}
          </p>
        )}
      </div>
      <AvisoErro mensagem={errors.root?.servidor?.message} />
      <Button type="submit" variant="destructive" disabled={isSubmitting}>
        Excluir minha conta
      </Button>
    </form>
  );
}
