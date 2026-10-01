"use client";

import { useForm, type FieldErrors, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  mensagemFalhaLogin,
  validarLogin,
  type CampoLogin,
  type DadosLogin,
  type EntradaLogin,
  type FalhaLogin,
} from "@/modules/identity";

const resolver: Resolver<EntradaLogin, unknown, DadosLogin> = (valores) => {
  const resultado = validarLogin(valores);
  if (resultado.ok) {
    return { values: resultado.dados, errors: {} };
  }
  const errors: FieldErrors<EntradaLogin> = {};
  for (const [campo, mensagem] of Object.entries(resultado.campos)) {
    errors[campo as CampoLogin] = { type: "validate", message: mensagem };
  }
  return { values: {}, errors };
};

const CAMPOS: readonly {
  nome: CampoLogin;
  rotulo: string;
  tipo: string;
  autoComplete: string;
}[] = [
  { nome: "email", rotulo: "E-mail", tipo: "email", autoComplete: "email" },
  { nome: "senha", rotulo: "Senha", tipo: "password", autoComplete: "current-password" },
];

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
    const falha = await acao(dados);
    if (falha !== undefined) {
      setError("root.servidor", { message: mensagemFalhaLogin(falha) });
    }
  }

  const erroServidor = errors.root?.servidor?.message;

  return (
    <form noValidate onSubmit={handleSubmit(enviar)} className="grid gap-5">
      {CAMPOS.map((campo) => {
        const erro = errors[campo.nome]?.message;
        const idErro = `${campo.nome}-erro`;
        return (
          <div key={campo.nome} className="grid gap-2">
            <label htmlFor={campo.nome} className="text-nota font-semibold">
              {campo.rotulo}
            </label>
            <input
              id={campo.nome}
              type={campo.tipo}
              autoComplete={campo.autoComplete}
              aria-invalid={erro !== undefined}
              aria-describedby={erro !== undefined ? idErro : undefined}
              className="h-12 rounded-campo border-2 border-[var(--kolo-contorno)] bg-transparent px-4 text-corpo outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
              {...register(campo.nome)}
            />
            {erro !== undefined && (
              <p id={idErro} role="alert" className="text-nota text-destructive">
                {erro}
              </p>
            )}
          </div>
        );
      })}
      {erroServidor !== undefined && (
        <p role="alert" className="text-nota text-destructive">
          {erroServidor}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting}>
        Entrar
      </Button>
    </form>
  );
}
