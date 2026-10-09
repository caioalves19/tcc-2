"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { unstable_rethrow } from "next/navigation";
import { Button } from "@/components/ui/button";

type Opcao = { id: string; nome: string };
type Resultado =
  { ok: true } | { ok: false; erro: string; mensagem: string; campos?: Record<string, string> };

// O que a edição precisa do horário (HorarioAgenda, PBI-34), com início e fim em São Paulo.
export type HorarioInicial = {
  id: string;
  artistaId: string;
  nomeContato: string;
  telefoneContato: string;
  emailCliente: string | null;
  inicio: string;
  fim: string;
  estiloId: string | null;
  tamanhoId: string | null;
  regiaoCorpo: string | null;
  observacoes: string | null;
};

type Props = {
  // Só o admin escolhe o artista; para o artista vem [] e o servidor usa a agenda dele.
  artistas: Opcao[];
  opcoes: { estilos: Opcao[]; tamanhos: Opcao[] };
  inicial?: HorarioInicial;
  // Server Action: cadastrarHorario ou editarHorario (com o id).
  enviar: (entrada: Record<string, string>) => Promise<Resultado>;
  aoSalvar: () => void;
  aoCancelar: () => void;
};

const CAMPO =
  "h-12 w-full rounded-campo border-2 border-[var(--kolo-contorno)] bg-transparent px-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

function Rotulado({
  id,
  rotulo,
  erro,
  children,
}: {
  id: string;
  rotulo: string;
  erro: string | undefined;
  children: (aria: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
  }) => ReactNode;
}) {
  const idErro = `${id}-erro`;
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-nota font-semibold">
        {rotulo}
      </label>
      {children({
        id,
        "aria-invalid": erro !== undefined,
        "aria-describedby": erro !== undefined ? idErro : undefined,
      })}
      {erro !== undefined && (
        <p id={idErro} className="text-nota text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}

// RF22: horário combinado no WhatsApp, digitado no horário de São Paulo (RN09). O servidor
// valida tudo de novo; aqui só se coleta e se mostra o erro no campo.
export function FormularioHorario({
  artistas,
  opcoes,
  inicial,
  enviar,
  aoSalvar,
  aoCancelar,
}: Props) {
  const [pendente, setPendente] = useState(false);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [mensagem, setMensagem] = useState<string | null>(null);
  const prefixo = inicial ? `horario-${inicial.id}` : "horario-novo";

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = Object.fromEntries(
      [...new FormData(evento.currentTarget).entries()].map(([chave, valor]) => [
        chave,
        String(valor),
      ]),
    );
    setPendente(true);
    setCampos({});
    setMensagem(null);
    try {
      const resultado = await enviar(inicial ? { id: inicial.id, ...dados } : dados);
      if (resultado.ok) aoSalvar();
      else if (resultado.erro === "invalido") setCampos(resultado.campos ?? {});
      else setMensagem(resultado.mensagem);
    } catch (falha) {
      unstable_rethrow(falha);
      setMensagem("Não foi possível salvar agora. Tente novamente.");
    } finally {
      setPendente(false);
    }
  }

  const id = (campo: string) => `${prefixo}-${campo}`;
  return (
    <form
      onSubmit={(evento) => void salvar(evento)}
      noValidate
      className="grid gap-4 rounded-card border-2 border-neutro-grafite bg-[var(--kolo-superficie)] p-5 text-[var(--kolo-superficie-texto)] sm:grid-cols-2"
    >
      {artistas.length > 0 && (
        <Rotulado id={id("artista")} rotulo="Artista" erro={campos.artistaId}>
          {(aria) => (
            <select
              name="artistaId"
              defaultValue={inicial?.artistaId ?? ""}
              className={CAMPO}
              {...aria}
            >
              <option value="">Escolha o artista</option>
              {artistas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          )}
        </Rotulado>
      )}
      <Rotulado id={id("nome")} rotulo="Nome do contato" erro={campos.nomeContato}>
        {(aria) => (
          <input
            name="nomeContato"
            defaultValue={inicial?.nomeContato}
            maxLength={120}
            className={CAMPO}
            {...aria}
          />
        )}
      </Rotulado>
      <Rotulado id={id("telefone")} rotulo="Telefone (com DDD)" erro={campos.telefoneContato}>
        {(aria) => (
          <input
            name="telefoneContato"
            type="tel"
            inputMode="tel"
            defaultValue={inicial?.telefoneContato}
            className={CAMPO}
            {...aria}
          />
        )}
      </Rotulado>
      <Rotulado
        id={id("email")}
        rotulo="E-mail da conta do cliente (opcional)"
        erro={campos.emailCliente}
      >
        {(aria) => (
          <input
            name="emailCliente"
            type="email"
            defaultValue={inicial?.emailCliente ?? ""}
            className={CAMPO}
            {...aria}
          />
        )}
      </Rotulado>
      <Rotulado id={id("inicio")} rotulo="Início" erro={campos.inicio}>
        {(aria) => (
          <input
            name="inicio"
            type="datetime-local"
            defaultValue={inicial?.inicio}
            className={CAMPO}
            {...aria}
          />
        )}
      </Rotulado>
      <Rotulado id={id("fim")} rotulo="Fim" erro={campos.fim}>
        {(aria) => (
          <input
            name="fim"
            type="datetime-local"
            defaultValue={inicial?.fim}
            className={CAMPO}
            {...aria}
          />
        )}
      </Rotulado>
      <Rotulado id={id("estilo")} rotulo="Estilo (opcional)" erro={campos.estiloId}>
        {(aria) => (
          <select
            name="estiloId"
            defaultValue={inicial?.estiloId ?? ""}
            className={CAMPO}
            {...aria}
          >
            <option value="">Sem estilo</option>
            {opcoes.estilos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        )}
      </Rotulado>
      <Rotulado id={id("tamanho")} rotulo="Tamanho (opcional)" erro={campos.tamanhoId}>
        {(aria) => (
          <select
            name="tamanhoId"
            defaultValue={inicial?.tamanhoId ?? ""}
            className={CAMPO}
            {...aria}
          >
            <option value="">Sem tamanho</option>
            {opcoes.tamanhos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        )}
      </Rotulado>
      <Rotulado id={id("regiao")} rotulo="Região do corpo (opcional)" erro={campos.regiaoCorpo}>
        {(aria) => (
          <input
            name="regiaoCorpo"
            defaultValue={inicial?.regiaoCorpo ?? ""}
            maxLength={80}
            className={CAMPO}
            {...aria}
          />
        )}
      </Rotulado>
      <div className="sm:col-span-2">
        <Rotulado id={id("observacoes")} rotulo="Observações (opcional)" erro={campos.observacoes}>
          {(aria) => (
            <textarea
              name="observacoes"
              defaultValue={inicial?.observacoes ?? ""}
              maxLength={1000}
              rows={3}
              className={`${CAMPO} h-auto py-2`}
              {...aria}
            />
          )}
        </Rotulado>
      </div>
      {mensagem && (
        <p role="alert" className="text-destructive sm:col-span-2">
          {mensagem}
        </p>
      )}
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="submit" disabled={pendente}>
          {pendente ? "Salvando…" : "Salvar horário"}
        </Button>
        <Button type="button" variant="contorno" onClick={aoCancelar}>
          Voltar
        </Button>
      </div>
    </form>
  );
}
