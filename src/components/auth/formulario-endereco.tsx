"use client";

import { useRef, useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { useForm } from "react-hook-form";
import { AvisoErro, Campo } from "@/components/auth/campo";
import { resolverDe } from "@/components/auth/resolver";
import { Button } from "@/components/ui/button";
import {
  validarEndereco,
  type DadosEndereco,
  type EnderecoDoCep,
  type EntradaEndereco,
  type ResultadoEndereco,
} from "@/modules/endereco";

const resolver = resolverDe(validarEndereco);

const soDigitos = (cep: string) => cep.replace(/\D/g, "");

export function FormularioEndereco({
  dados,
  acao,
  buscarCep,
}: {
  dados: EntradaEndereco;
  acao: (entrada: EntradaEndereco) => Promise<ResultadoEndereco>;
  buscarCep?: (cep: string) => Promise<EnderecoDoCep | null>;
}) {
  const [sucesso, setSucesso] = useState(false);
  // Só consulta quando o CEP muda: passar pelo campo não sobrescreve o endereço já salvo.
  const ultimoCep = useRef(soDigitos(dados.cep));
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    setFocus,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EntradaEndereco, unknown, DadosEndereco>({ resolver, defaultValues: dados });
  // RF05: o CEP preenche rua, bairro, cidade e UF. Sem resposta, o formulário segue manual.
  async function preencherPeloCep(cep: string) {
    const digitos = soDigitos(cep);
    if (buscarCep === undefined || digitos.length !== 8 || digitos === ultimoCep.current) return;
    ultimoCep.current = digitos;
    let encontrado: EnderecoDoCep | null = null;
    try {
      encontrado = await buscarCep(cep);
    } catch (erro) {
      unstable_rethrow(erro);
    }
    if (encontrado === null) return;
    const opcoes = { shouldDirty: true, shouldValidate: false };
    setValue("logradouro", encontrado.logradouro, opcoes);
    setValue("bairro", encontrado.bairro, opcoes);
    setValue("cidade", encontrado.cidade, opcoes);
    setValue("uf", encontrado.uf, opcoes);
    setFocus(encontrado.logradouro === "" ? "logradouro" : "numero");
  }
  async function enviar(entrada: DadosEndereco) {
    try {
      const resultado = await acao({ ...entrada, complemento: entrada.complemento ?? "" });
      if (resultado.ok) {
        reset({ ...entrada, complemento: entrada.complemento ?? "" });
        setSucesso(true);
      } else if (resultado.erro === "invalido") {
        for (const [campo, mensagem] of Object.entries(resultado.campos))
          setError(campo as keyof EntradaEndereco, { message: mensagem });
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
      method="post"
      noValidate
      onChange={() => setSucesso(false)}
      onSubmit={(evento) => {
        setSucesso(false);
        void handleSubmit(enviar)(evento);
      }}
      className="grid gap-5"
    >
      <Campo
        id="destinatario"
        rotulo="Nome de quem recebe"
        tipo="text"
        autoComplete="shipping name"
        registro={register("destinatario")}
        erro={errors.destinatario?.message}
      />
      <Campo
        id="cep"
        rotulo="CEP"
        tipo="text"
        autoComplete="shipping postal-code"
        registro={register("cep", {
          onBlur: (evento: React.FocusEvent<HTMLInputElement>) =>
            void preencherPeloCep(evento.target.value),
        })}
        erro={errors.cep?.message}
      />
      <Campo
        id="logradouro"
        rotulo="Rua ou avenida"
        tipo="text"
        autoComplete="shipping address-line1"
        registro={register("logradouro")}
        erro={errors.logradouro?.message}
      />
      <Campo
        id="numero"
        rotulo="Número"
        tipo="text"
        autoComplete="off"
        registro={register("numero")}
        erro={errors.numero?.message}
      />
      <Campo
        id="complemento"
        rotulo="Complemento (opcional)"
        tipo="text"
        autoComplete="shipping address-line2"
        registro={register("complemento")}
        erro={errors.complemento?.message}
      />
      <Campo
        id="bairro"
        rotulo="Bairro"
        tipo="text"
        autoComplete="shipping address-level3"
        registro={register("bairro")}
        erro={errors.bairro?.message}
      />
      <Campo
        id="cidade"
        rotulo="Cidade"
        tipo="text"
        autoComplete="shipping address-level2"
        registro={register("cidade")}
        erro={errors.cidade?.message}
      />
      <Campo
        id="uf"
        rotulo="UF"
        tipo="text"
        autoComplete="shipping address-level1"
        registro={register("uf")}
        erro={errors.uf?.message}
      />
      <AvisoErro mensagem={errors.root?.servidor?.message} />
      {sucesso && (
        <p role="status" className="text-corpo">
          Endereço salvo com sucesso.
        </p>
      )}
      <Button type="submit" disabled={isSubmitting}>
        Salvar endereço
      </Button>
    </form>
  );
}
