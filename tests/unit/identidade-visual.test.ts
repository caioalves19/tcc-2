import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * Contrato testado: as variáveis `--kolo-*` de cada modo de marca em
 * `src/app/globals.css` — é o que os componentes consomem.
 *
 * Mínimos do RNF23 (WCAG 2.1 AA): 4,5:1 para texto e 3:1 para elementos de
 * interface (anel de foco, borda de campo) e texto grande.
 * Regras de uso: docs/IDENTIDADE-VISUAL.md
 */

const AA_TEXTO = 4.5;
const AA_INTERFACE = 3;

const css = readFileSync(new URL("../../src/app/globals.css", import.meta.url), "utf8");

/** Declarações `--nome: valor;` do primeiro bloco cujo seletor contém `marcador`. */
function bloco(marcador: string): Map<string, string> {
  const inicio = css.indexOf(marcador);
  if (inicio === -1) throw new Error(`Bloco "${marcador}" não existe em globals.css`);
  const abre = css.indexOf("{", inicio);
  const fecha = css.indexOf("}", abre);
  if (abre === -1 || fecha === -1) throw new Error(`Bloco "${marcador}" está malformado`);

  const declaracoes = new Map<string, string>();
  for (const [, nome, valor] of css.slice(abre, fecha).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    declaracoes.set(nome, valor.trim());
  }
  return declaracoes;
}

const paleta = bloco("@theme");

/** Resolve o token até o hex, seguindo `var(--outro-token)`. */
function hex(token: string, modo: Map<string, string>): string {
  let valor = modo.get(token) ?? paleta.get(token);
  for (let saltos = 0; valor !== undefined && saltos < 5; saltos += 1) {
    if (/^#[0-9a-f]{6}$/i.test(valor)) return valor;
    const referencia = valor.match(/^var\((--[\w-]+)\)$/);
    if (!referencia?.[1]) break;
    valor = modo.get(referencia[1]) ?? paleta.get(referencia[1]);
  }
  throw new Error(`Token ${token} não resolve para um hex (valor: ${valor ?? "ausente"})`);
}

/** Luminância relativa — WCAG 2.1, "relative luminance". */
function luminancia(cor: string): number {
  const canais = [1, 3, 5].map((i) => {
    const canal = Number.parseInt(cor.slice(i, i + 2), 16) / 255;
    return canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2];
}

/** Razão de contraste — WCAG 2.1, "contrast ratio". */
function razao(frente: string, fundo: string): number {
  const [clara, escura] = [luminancia(frente), luminancia(fundo)].sort((a, b) => b - a) as [
    number,
    number,
  ];
  return (clara + 0.05) / (escura + 0.05);
}

const PARES_DE_TEXTO = [
  ["--kolo-texto", "--kolo-fundo"],
  ["--kolo-texto-suave", "--kolo-fundo"],
  ["--kolo-link", "--kolo-fundo"],
  ["--kolo-superficie-texto", "--kolo-superficie"],
  ["--kolo-superficie-suave", "--kolo-superficie"],
  ["--kolo-superficie-link", "--kolo-superficie"],
  ["--kolo-acao-texto", "--kolo-acao"],
  ["--kolo-acao-texto", "--kolo-acao-hover"],
  ["--kolo-marca-texto", "--kolo-marca"],
  ["--kolo-erro", "--kolo-superficie"],
  ["--kolo-erro-texto", "--kolo-erro-fundo"],
] as const;

const PARES_DE_INTERFACE = [
  ["--kolo-foco", "--kolo-fundo"],
  ["--kolo-superficie-foco", "--kolo-superficie"],
  ["--kolo-borda-campo", "--kolo-superficie"],
] as const;

const MODOS = [["Ateliê", ":root"]] as const;

describe("razão de contraste (WCAG 2.1)", () => {
  it("preto sobre branco é 21:1", () => {
    expect(razao("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  it("uma cor sobre ela mesma é 1:1", () => {
    expect(razao("#0b2d6f", "#0b2d6f")).toBeCloseTo(1, 5);
  });
});

describe.each(MODOS)("modo %s — contraste dos tokens (RNF23)", (_nome, seletor) => {
  const modo = bloco(seletor);

  it.each(PARES_DE_TEXTO)("texto %s sobre %s tem ao menos 4,5:1", (frente, fundo) => {
    expect(razao(hex(frente, modo), hex(fundo, modo))).toBeGreaterThanOrEqual(AA_TEXTO);
  });

  it.each(PARES_DE_INTERFACE)("interface %s sobre %s tem ao menos 3:1", (frente, fundo) => {
    expect(razao(hex(frente, modo), hex(fundo, modo))).toBeGreaterThanOrEqual(AA_INTERFACE);
  });
});
