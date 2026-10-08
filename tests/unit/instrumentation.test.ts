import { afterEach, expect, it, vi } from "vitest";

vi.mock("../../src/lib/ambiente", () => ({ verificarAmbienteDeProducao: vi.fn() }));
vi.mock("../../src/lib/tarefas", () => ({
  iniciarTarefas: vi.fn(async () => {
    throw new Error("connect ECONNREFUSED 127.0.0.1:5432");
  }),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

// A limpeza de reservas é só higiene (a disponibilidade já ignora as vencidas):
// se a fila não sobe, a loja sobe mesmo assim e o motivo fica no log.
it("RN03 o servidor sobe mesmo se a fila de tarefas falhar", async () => {
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const { register } = await import("../../src/instrumentation");

  await expect(register()).resolves.toBeUndefined();
  expect(log).toHaveBeenCalledWith(
    "Fila de tarefas não iniciou",
    "connect ECONNREFUSED 127.0.0.1:5432",
  );
});
