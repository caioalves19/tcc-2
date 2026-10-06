"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Script from "next/script";

import { Campo } from "@/components/auth/campo";
import { resolverDe } from "@/components/auth/resolver";
import { Button } from "@/components/ui/button";
import {
  validarContato,
  type CampoContato,
  type DadosContato,
  type EntradaContato,
} from "@/modules/contact/validacao";
import { enviarContato } from "@/modules/contact/actions";

const resolver = resolverDe(validarContato);

export function FormularioContato() {
  const [mensagemServidor, setMensagemServidor] = useState<{ texto: string; erro: boolean } | null>(null);
  
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EntradaContato, unknown, DadosContato>({ resolver });

  useEffect(() => {
    (window as unknown as { onTurnstileSuccess: (token: string) => void }).onTurnstileSuccess = (token: string) => {
      setValue("tokenTurnstile", token, { shouldValidate: true });
    };
    return () => {
      delete (window as unknown as { onTurnstileSuccess?: (token: string) => void }).onTurnstileSuccess;
    };
  }, [setValue]);

  async function enviar(dados: DadosContato) {
    setMensagemServidor(null);
    const resultado = await enviarContato(dados);
    
    if (resultado.ok) {
      setMensagemServidor({ texto: "Mensagem enviada com sucesso!", erro: false });
      reset();
      const w = window as unknown as { turnstile?: { reset: () => void } };
      if (w.turnstile) {
        w.turnstile.reset();
      }
    } else if ("campos" in resultado) {
      for (const [campo, mensagem] of Object.entries(resultado.campos)) {
        setError(campo as CampoContato, { message: mensagem as string });
      }
    } else if ("mensagem" in resultado) {
      setMensagemServidor({ texto: resultado.mensagem, erro: true });
    }
  }

  // Fallback sitekey for testing if NEXT_PUBLIC_TURNSTILE_SITE_KEY is not defined.
  // "1x00000000000000000000AA" is Cloudflare's always-passes testing key.
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      <form noValidate onSubmit={handleSubmit(enviar)} className="grid gap-5">
        <Campo
          id="nome"
          rotulo="Nome"
          tipo="text"
          autoComplete="name"
          erro={errors.nome?.message}
          registro={register("nome")}
        />
        <Campo
          id="email"
          rotulo="E-mail"
          tipo="email"
          autoComplete="email"
          erro={errors.email?.message}
          registro={register("email")}
        />
        <div className="grid gap-1.5">
          <label htmlFor="mensagem" className="text-sm font-medium leading-none text-foreground">
            Mensagem
          </label>
          <textarea
            id="mensagem"
            className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            {...register("mensagem")}
          />
          {errors.mensagem?.message && (
            <p className="text-[0.8rem] font-medium text-destructive">{errors.mensagem.message}</p>
          )}
        </div>
        
        <div 
          className="cf-turnstile" 
          data-sitekey={sitekey}
          data-callback="onTurnstileSuccess"
        ></div>
        {errors.tokenTurnstile?.message && (
          <p className="text-[0.8rem] font-medium text-destructive">{errors.tokenTurnstile.message}</p>
        )}

        {mensagemServidor && (
          <div className={`p-3 rounded-md text-sm font-medium ${mensagemServidor.erro ? "bg-destructive/15 text-destructive" : "bg-green-100 text-green-800"}`}>
            {mensagemServidor.texto}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting}>
          Enviar mensagem
        </Button>
      </form>
    </>
  );
}
