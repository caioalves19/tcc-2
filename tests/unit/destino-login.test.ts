import { expect, it } from "vitest";

import { destinoPosLogin } from "@/modules/identity";

it.each(["/checkout", "/conta/pedidos/20261014-DEMO04", "/agenda?semana=2026-11-02"])(
  "aceita o caminho interno %s",
  (caminho) => {
    expect(destinoPosLogin(caminho)).toBe(caminho);
  },
);

it.each([
  ["URL externa", "https://evil.com"],
  ["URL sem esquema", "//evil.com"],
  ["barra invertida", "/\\evil.com"],
  ["barra invertida no meio", "/foo\\bar"],
  ["esquema javascript", "javascript:alert(1)"],
  ["caminho relativo", "checkout"],
  ["quebra de linha", "/\n/evil.com"],
  ["tabulação", "/\t/evil.com"],
  ["vazio", ""],
  ["ausente", undefined],
  ["repetido na URL", ["/checkout", "/agenda"]],
])("%s cai em /", (_caso, valor) => {
  expect(destinoPosLogin(valor)).toBe("/");
});
