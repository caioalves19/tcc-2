"use client";

import { useForm } from "react-hook-form";

import { Campo } from "@/components/auth/campo";
import { resolverDe } from "@/components/auth/resolver";
import { Button } from "@/components/ui/button";
import {
  MENSAGEM_EMAIL_DUPLICADO,
  validarCadastro,
  type CampoCadastro,
  type DadosCadastro,
  type EntradaCadastro,
  type FalhaCadastro,
} from "@/modules/identity";

const resolver = resolverDe(validarCadastro);

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
      {CAMPOS.map((campo) => (
        <Campo
          key={campo.nome}
          id={campo.nome}
          rotulo={campo.rotulo}
          tipo={campo.tipo}
          autoComplete={campo.autoComplete}
          erro={errors[campo.nome]?.message}
          registro={register(campo.nome)}
        />
      ))}
      <Button type="submit" disabled={isSubmitting}>
        Criar conta
      </Button>
    </form>
  );
}
