"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { unstable_rethrow } from "next/navigation";
import { Button } from "@/components/ui/button";
import type {
  DadosWizard,
  OpcoesWizard,
  PreferenciaWizard,
  ResultadoWizard,
} from "@/modules/scheduling";

const ETAPAS = ["Nome", "Artista", "Estilo", "Região", "Tamanho", "Preferência"];
const CAMPO =
  "mt-2 min-h-12 w-full rounded-campo border-2 border-[var(--kolo-contorno)] bg-[var(--kolo-superficie)] px-3 py-2 text-[var(--kolo-superficie-texto)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kolo-acao)]";
const INICIAL: DadosWizard = {
  nome: "",
  artistaId: "",
  estiloId: "",
  regiao: "",
  tamanhoId: "",
  data: "",
  horario: "",
};

export function WizardAgendamento({
  opcoes,
  revisar,
}: {
  opcoes: OpcoesWizard;
  revisar: (entrada: DadosWizard) => Promise<ResultadoWizard<PreferenciaWizard>>;
}) {
  const [etapa, setEtapa] = useState(0);
  const [dados, setDados] = useState<DadosWizard>(INICIAL);
  const [resumo, setResumo] = useState<PreferenciaWizard | null>(null);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const artista = opcoes.artistas.find(({ id }) => id === dados.artistaId);
  const vazio = opcoes.artistas.length === 0 || opcoes.tamanhos.length === 0;
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

  useEffect(() => {
    titulo.current?.focus();
  }, [etapa, resumo]);

  function alterar(campo: keyof DadosWizard, valor: string) {
    setDados((atual) => ({
      ...atual,
      [campo]: valor,
      ...(campo === "artistaId" && valor !== atual.artistaId ? { estiloId: "" } : {}),
    }));
    setErro("");
    setResumo(null);
  }

  async function avancar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (ocupado) return;
    const formulario = evento.currentTarget;
    const campos = Array.from(
      formulario.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select"),
    );
    const invalido = campos.find(
      (campo) =>
        !campo.checkValidity() ||
        ((campo.name === "nome" || campo.name === "regiao") && campo.value.trim().length < 2),
    );
    if (invalido) {
      setErro("Preencha corretamente os campos desta etapa para continuar.");
      invalido.focus();
      return;
    }
    if (etapa < 5) {
      setErro("");
      setEtapa(etapa + 1);
      return;
    }
    setOcupado(true);
    setErro("");
    try {
      const resultado = await revisar(dados);
      if (resultado.ok) setResumo(resultado.dados);
      else setErro(resultado.mensagem);
    } catch (falha) {
      unstable_rethrow(falha);
      setErro("Não foi possível revisar suas preferências. Tente novamente.");
    } finally {
      setOcupado(false);
    }
  }

  function voltar() {
    setErro("");
    setEtapa((atual) => Math.max(0, atual - 1));
  }

  if (vazio)
    return (
      <p role="status">
        Ainda não há opções disponíveis para agendamento. Tente novamente mais tarde.
      </p>
    );

  const erroId = erro ? "wizard-erro" : undefined;
  return (
    <div className="min-w-0">
      <ol
        aria-label="Etapas do agendamento"
        className="mb-8 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-6"
      >
        {ETAPAS.map((nome, indice) => (
          <li
            key={nome}
            aria-current={!resumo && etapa === indice ? "step" : undefined}
            className={`rounded-campo border p-2 ${etapa === indice && !resumo ? "border-[var(--kolo-acao)] font-bold" : "border-[var(--kolo-contorno)]"}`}
          >
            {indice + 1}. {nome}
          </li>
        ))}
      </ol>
      {resumo ? (
        <section aria-labelledby="wizard-titulo">
          <h2 id="wizard-titulo" ref={titulo} tabIndex={-1} className="font-display text-2xl">
            Revise suas preferências
          </h2>
          <dl className="my-6 grid gap-3 break-words">
            {[
              ["Nome", resumo.nome],
              ["Artista", artista?.nome],
              ["Estilo", artista?.estilos.find(({ id }) => id === resumo.estiloId)?.nome],
              ["Região", resumo.regiao],
              ["Tamanho", opcoes.tamanhos.find(({ id }) => id === resumo.tamanhoId)?.nome],
              [
                "Preferência",
                `${resumo.data.split("-").reverse().join("/")} às ${resumo.horario} (São Paulo)`,
              ],
            ].map(([rotulo, valor]) => (
              <div key={rotulo}>
                <dt className="font-bold">{rotulo}</dt>
                <dd>{valor}</dd>
              </div>
            ))}
          </dl>
          <p role="status" className="mb-6">
            A confirmação e o envio ainda não estão disponíveis. Nenhuma solicitação foi enviada e
            nenhum horário foi reservado.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="contorno"
              onClick={() => {
                setResumo(null);
                setErro("");
              }}
            >
              Editar preferências
            </Button>
            <Button
              type="button"
              disabled
              className="h-auto min-h-12 max-w-full whitespace-normal py-3"
            >
              Continuar para confirmação
            </Button>
          </div>
        </section>
      ) : (
        <form noValidate onSubmit={avancar} aria-busy={ocupado} className="grid gap-5">
          <h2 id="wizard-titulo" ref={titulo} tabIndex={-1} className="font-display text-2xl">
            {etapa + 1}. {ETAPAS[etapa]}
          </h2>
          {etapa === 0 && (
            <label htmlFor="wizard-nome">
              Seu nome
              <input
                id="wizard-nome"
                name="nome"
                disabled={ocupado}
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                className={CAMPO}
                value={dados.nome}
                onChange={(e) => alterar("nome", e.target.value)}
                aria-describedby={erroId}
                aria-invalid={!!erro}
              />
            </label>
          )}
          {etapa === 1 && (
            <label htmlFor="wizard-artista">
              Artista
              <select
                id="wizard-artista"
                name="artistaId"
                disabled={ocupado}
                required
                className={CAMPO}
                value={dados.artistaId}
                onChange={(e) => alterar("artistaId", e.target.value)}
                aria-describedby={erroId}
                aria-invalid={!!erro}
              >
                <option value="">Selecione um artista</option>
                {opcoes.artistas.map(({ id, nome }) => (
                  <option key={id} value={id}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
          )}
          {etapa === 2 && (
            <div>
              <label htmlFor="wizard-estilo">
                Estilo
                <select
                  id="wizard-estilo"
                  name="estiloId"
                  disabled={ocupado}
                  required
                  className={CAMPO}
                  value={dados.estiloId}
                  onChange={(e) => alterar("estiloId", e.target.value)}
                  aria-describedby={erroId}
                  aria-invalid={!!erro}
                >
                  <option value="">Selecione um estilo</option>
                  {artista?.estilos.map(({ id, nome }) => (
                    <option key={id} value={id}>
                      {nome}
                    </option>
                  ))}
                </select>
              </label>
              {artista?.estilos.length === 0 && (
                <p role="status" className="mt-3">
                  Este artista ainda não tem estilos disponíveis. Volte e escolha outro artista.
                </p>
              )}
            </div>
          )}
          {etapa === 3 && (
            <label htmlFor="wizard-regiao">
              Região do corpo
              <input
                id="wizard-regiao"
                name="regiao"
                disabled={ocupado}
                required
                minLength={2}
                maxLength={80}
                placeholder="Ex.: antebraço"
                className={CAMPO}
                value={dados.regiao}
                onChange={(e) => alterar("regiao", e.target.value)}
                aria-describedby={erroId}
                aria-invalid={!!erro}
              />
            </label>
          )}
          {etapa === 4 && (
            <label htmlFor="wizard-tamanho">
              Tamanho aproximado
              <select
                id="wizard-tamanho"
                name="tamanhoId"
                disabled={ocupado}
                required
                className={CAMPO}
                value={dados.tamanhoId}
                onChange={(e) => alterar("tamanhoId", e.target.value)}
                aria-describedby={erroId}
                aria-invalid={!!erro}
              >
                <option value="">Selecione um tamanho</option>
                {opcoes.tamanhos.map(({ id, nome }) => (
                  <option key={id} value={id}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
          )}
          {etapa === 5 && (
            <div className="grid gap-5 sm:grid-cols-2">
              <label htmlFor="wizard-data">
                Data de preferência
                <input
                  id="wizard-data"
                  name="data"
                  disabled={ocupado}
                  type="date"
                  required
                  min={hoje}
                  className={CAMPO}
                  value={dados.data}
                  onChange={(e) => alterar("data", e.target.value)}
                  aria-describedby={erroId}
                  aria-invalid={!!erro}
                />
              </label>
              <label htmlFor="wizard-horario">
                Horário de preferência
                <input
                  id="wizard-horario"
                  name="horario"
                  disabled={ocupado}
                  type="time"
                  required
                  className={CAMPO}
                  value={dados.horario}
                  onChange={(e) => alterar("horario", e.target.value)}
                  aria-describedby={erroId}
                  aria-invalid={!!erro}
                />
              </label>
              <p className="sm:col-span-2">
                Horário de São Paulo. A preferência está sujeita à confirmação e não reserva uma
                vaga.
              </p>
            </div>
          )}
          {erro && (
            <p id="wizard-erro" role="alert" className="text-destructive">
              {erro}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {etapa > 0 && (
              <Button type="button" variant="contorno" disabled={ocupado} onClick={voltar}>
                Voltar
              </Button>
            )}
            <Button type="submit" disabled={ocupado}>
              {ocupado ? "Revisando…" : etapa === 5 ? "Revisar preferências" : "Avançar"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
