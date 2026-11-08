// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { FormularioContato } from "@/app/contato/formulario";
import { FormularioAdmin } from "@/components/admin/formulario";
import { FormularioHorario } from "@/components/agenda/formulario-horario";
import { WizardAgendamento } from "@/components/scheduling/wizard-agendamento";
import { FormularioCadastro } from "@/components/auth/formulario-cadastro";
import { FormularioEndereco } from "@/components/auth/formulario-endereco";
import { FormularioExclusaoConta } from "@/components/auth/formulario-exclusao-conta";
import { FormularioLogin } from "@/components/auth/formulario-login";
import { FormularioPedidoRecuperacao } from "@/components/auth/formulario-pedido-recuperacao";
import { FormularioPerfil } from "@/components/auth/formulario-perfil";
import { FormularioRedefinicao } from "@/components/auth/formulario-redefinicao";
import { FormularioTrocaSenha } from "@/components/auth/formulario-troca-senha";

vi.mock("@/modules/contact/actions", () => ({ enviarContato: vi.fn() }));

afterEach(cleanup);

const acao = vi.fn();
const endereco = {
  destinatario: "Maria",
  cep: "01310-100",
  logradouro: "Avenida Paulista",
  numero: "1000",
  complemento: "",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "SP",
};

// RNF06/RNF12 (APS, achado do OWASP ZAP): sem method, o formulário enviado antes da hidratação
// vira GET e põe senha e dados pessoais na URL (histórico, logs do servidor, Referer).
it.each<[string, () => ReactElement]>([
  ["login", () => <FormularioLogin acao={acao} />],
  ["cadastro", () => <FormularioCadastro acao={acao} />],
  ["pedido de recuperação", () => <FormularioPedidoRecuperacao acao={acao} />],
  ["redefinição de senha", () => <FormularioRedefinicao token="abc" acao={acao} />],
  ["troca de senha", () => <FormularioTrocaSenha acao={acao} />],
  ["exclusão de conta", () => <FormularioExclusaoConta acao={acao} />],
  [
    "perfil",
    () => <FormularioPerfil dados={{ nome: "Maria", telefone: "11987654321" }} acao={acao} />,
  ],
  ["endereço", () => <FormularioEndereco dados={endereco} acao={acao} />],
  ["contato", () => <FormularioContato />],
  [
    "agendamento (wizard)",
    () => (
      <WizardAgendamento
        opcoes={{
          artistas: [{ id: "ana", nome: "Ana", estilos: [{ id: "fineline", nome: "Fineline" }] }],
          tamanhos: [{ id: "pequena", nome: "Pequena" }],
        }}
        revisar={acao}
      />
    ),
  ],
  [
    "horário da agenda",
    () => (
      <FormularioHorario
        artistas={[]}
        opcoes={{ estilos: [], tamanhos: [] }}
        enviar={acao}
        aoSalvar={acao}
        aoCancelar={acao}
      />
    ),
  ],
  [
    "cadastro do admin",
    () => (
      <FormularioAdmin pendente={false} enviar={acao}>
        <input name="titulo" />
      </FormularioAdmin>
    ),
  ],
])("o formulário de %s envia por POST, nunca pela URL", (_nome, montar) => {
  const { container } = render(montar());
  const formulario = container.querySelector("form");

  expect(formulario?.method).toBe("post");
});
