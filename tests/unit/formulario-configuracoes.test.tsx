// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { FormularioConfiguracoes } from "../../src/components/admin/formulario-configuracoes";
import { PADRAO } from "../../src/modules/settings";

const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }), unstable_rethrow: vi.fn() }));
// Formulário longo: com a suíte inteira em paralelo, o padrão de 5 s fica justo.
vi.setConfig({ testTimeout: 15_000 });
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const CONFIGURADO = {
  ...PADRAO,
  horarios: ["Ter a sex, 10h às 19h", "Sáb, 10h às 16h"],
};

it("RF31 começa com os valores atuais, um horário por linha", () => {
  render(<FormularioConfiguracoes configuracao={CONFIGURADO} salvar={vi.fn()} />);
  const valor = (rotulo: string) =>
    (screen.getByLabelText(rotulo) as HTMLInputElement | HTMLTextAreaElement).value;
  expect(valor("E-mail")).toBe("ateliekolo@gmail.com");
  expect(valor("WhatsApp (com 55 e DDD)")).toBe("5511950901191");
  expect(valor("Instagram do ateliê")).toBe("koloatelie");
  expect(valor("Instagram do tattoo")).toBe("kolotattoo");
  expect(valor("Horários (uma linha por item, até 4)")).toBe(
    "Ter a sex, 10h às 19h\nSáb, 10h às 16h",
  );
  expect(valor("Apresentação da home")).toBe(PADRAO.textos.apresentacao);
  expect(valor("Frase do bloco de tatuagem")).toBe(PADRAO.textos.tatuagem);
  expect(valor("Texto da faixa de murais")).toBe(PADRAO.textos.murais);
  expect(valor("Frase do rodapé")).toBe(PADRAO.textos.rodape);
});

it("RF31 envia tudo de uma vez e avisa quando salvou", async () => {
  const usuario = userEvent.setup();
  const salvar = vi.fn().mockResolvedValue({ ok: true, dados: PADRAO });
  render(<FormularioConfiguracoes configuracao={CONFIGURADO} salvar={salvar} />);
  const whatsapp = screen.getByLabelText("WhatsApp (com 55 e DDD)");
  await usuario.clear(whatsapp);
  await usuario.type(whatsapp, "55 11 91234-5678");
  await usuario.click(screen.getByRole("button", { name: "Salvar configurações" }));
  expect(salvar).toHaveBeenCalledWith({
    contato: {
      email: "ateliekolo@gmail.com",
      whatsapp: "55 11 91234-5678",
      instagramAtelie: "koloatelie",
      instagramTattoo: "kolotattoo",
    },
    horarios: "Ter a sex, 10h às 19h\nSáb, 10h às 16h",
    textos: PADRAO.textos,
  });
  expect(screen.getByRole("status").textContent).toBe("Configurações salvas.");
  expect(refresh).toHaveBeenCalled();
});

it("RF31 mostra o erro de validação do servidor", async () => {
  const usuario = userEvent.setup();
  const salvar = vi.fn().mockResolvedValue({
    ok: false,
    erro: "invalido",
    mensagem: "Informe o WhatsApp com 55, DDD e número (ex.: 55 11 95090-1191).",
  });
  render(<FormularioConfiguracoes configuracao={PADRAO} salvar={salvar} />);
  await usuario.click(screen.getByRole("button", { name: "Salvar configurações" }));
  expect(screen.getByRole("alert").textContent).toContain("Informe o WhatsApp com 55");
  expect(refresh).not.toHaveBeenCalled();
});

it("RF31 depois de salvar, os campos mostram o valor como ficou gravado, e o aviso continua", async () => {
  const usuario = userEvent.setup();
  const salvar = vi.fn().mockResolvedValue({ ok: true, dados: PADRAO });
  const { rerender } = render(<FormularioConfiguracoes configuracao={PADRAO} salvar={salvar} />);
  const whatsapp = screen.getByLabelText("WhatsApp (com 55 e DDD)");
  await usuario.clear(whatsapp);
  await usuario.type(whatsapp, "+55 (11) 91234-5678");
  await usuario.click(screen.getByRole("button", { name: "Salvar configurações" }));
  // A página volta (router.refresh) com o número normalizado pelo servidor.
  rerender(
    <FormularioConfiguracoes
      configuracao={{ ...PADRAO, contato: { ...PADRAO.contato, whatsapp: "5511912345678" } }}
      salvar={salvar}
    />,
  );
  expect((screen.getByLabelText("WhatsApp (com 55 e DDD)") as HTMLInputElement).value).toBe(
    "5511912345678",
  );
  expect(screen.getByRole("status").textContent).toBe("Configurações salvas.");
});
