"use client";

import { useForm, type FieldErrors, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  MENSAGEM_EMAIL_DUPLICADO,
  validarCadastro,
  type CampoCadastro,
  type DadosCadastro,
  type EntradaCadastro,
  type FalhaCadastro,
} from "@/modules/identity";

// Mesmo schema do servidor: o front só adianta o erro, quem decide é a action.
const resolver: Resolver<EntradaCadastro, unknown, DadosCadastro> = (valores) => {
  const resultado = validarCadastro(valores);
  if (resultado.ok) {
    return { values: resultado.dados, errors: {} };
  }
  const errors: FieldErrors<EntradaCadastro> = {};
  for (const [campo, mensagem] of Object.entries(resultado.campos)) {
    errors[campo as CampoCadastro] = { type: "validate", message: mensagem };
  }
  return { values: {}, errors };
};

const CAMPOS: readonly {
  nome: CampoCadastro;
  rotulo: string;
  tipo: string;
  autoComplete: string;
}[] = [
  { nome: "nome", rotulo: "Nome", tipo: "text", autoComplete: "name" },
  { nome: "email", rotulo: "E-mail", tipo: "email", autoComplete: "email" },
  { nome: "telefone", rotulo: "Telefone", tipo: "tel", autoComplete: "tel" },
  { nome: "senha", rotulo: "Senha", tipo: "password", autoComplete: "new-password" },
];

export function FormularioCadastro({
  acao,
}: {
  acao: (entrada: EntradaCadastro) => Promise<FalhaCadastro | undefined>;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EntradaCadastro, unknown, DadosCadastro>({ resolver });

  async function enviar(dados: DadosCadastro) {
    const falha = await acao(dados);
    if (falha?.erro === "email_duplicado") {
      setError("email", { message: MENSAGEM_EMAIL_DUPLICADO });
    } else if (falha?.erro === "invalido") {
      for (const [campo, mensagem] of Object.entries(falha.campos)) {
        setError(campo as CampoCadastro, { message: mensagem });
      }
    }
  }

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
      <Button type="submit" disabled={isSubmitting}>
        Criar conta
      </Button>
    </form>
  );
}
