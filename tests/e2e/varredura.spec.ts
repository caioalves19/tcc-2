import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { EXCECOES } from "./excecoes-a11y";
import { entrar } from "./sessao";
import { CONTA_DO_PAPEL, TELAS } from "./telas";

// RNF20: de 320 a 1920 px sem rolagem horizontal (as larguras do §13 mais a de 1920).
const LARGURAS = [320, 768, 1440, 1920];
// RNF21: o axe roda no celular e no desktop; nas larguras do meio o resultado se repete.
const LARGURAS_AXE = new Set([320, 1440]);
// RNF21: WCAG 2.1 A e AA. Crítico e sério reprovam (o contraste AA o axe classifica como sério).
const TAGS_WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const IMPACTOS = new Set(["critical", "serious"]);

// Uma exceção com o nome de uma tela que não está na tabela nunca seria conferida.
test("RNF20/RNF21 toda exceção aponta uma tela da varredura", () => {
  const nomes = new Set(TELAS.map((tela) => tela.nome));
  expect(EXCECOES.filter((e) => !nomes.has(e.tela)).map((e) => e.tela)).toEqual([]);
});

for (const tela of TELAS) {
  test(`RNF20/RNF21 ${tela.nome} (${tela.papel})`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    if (tela.papel !== "visitante") await entrar(page, CONTA_DO_PAPEL[tela.papel]);

    // regra → onde apareceu (largura e alvos), para a mensagem de falha apontar o problema.
    const encontradas = new Map<string, string[]>();
    const anotar = (regra: string, detalhe: string) =>
      encontradas.set(regra, [...(encontradas.get(regra) ?? []), detalhe]);

    for (const largura of LARGURAS) {
      await page.setViewportSize({ width: largura, height: 900 });
      const resposta = await page.goto(tela.caminho);
      expect(resposta?.status(), `status de ${tela.caminho}`).toBe(tela.status ?? 200);
      // "load", não "networkidle": o Turnstile do contato mantém a rede ocupada.
      await page.waitForLoadState("load");

      // A sobra e os elementos que passam da borda direita, para apontar onde corrigir.
      const { sobra, culpados } = await page.evaluate(() => {
        const limite = window.innerWidth;
        const descrever = (el: Element) =>
          el.tagName.toLowerCase() +
          (el.id ? `#${el.id}` : "") +
          (typeof el.className === "string" && el.className
            ? `.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}`
            : "");
        const fora = [...document.body.querySelectorAll("*")].filter(
          (el) => el.getBoundingClientRect().right > limite + 1,
        );
        // Só os mais internos: o pai de um elemento que estoura também "estoura".
        const folhas = fora.filter(
          (el) => !fora.some((outro) => outro !== el && el.contains(outro)),
        );
        return {
          sobra: document.documentElement.scrollWidth - limite,
          culpados: folhas.slice(0, 3).map(descrever),
        };
      });
      if (sobra > 0)
        anotar("rolagem-horizontal", `${largura}px: ${sobra}px a mais em ${culpados.join(" | ")}`);

      // §13: capturas de tela como evidência do RNF20 (vão para o relatório, não para o git).
      await testInfo.attach(`${tela.nome} ${largura}px`, {
        body: await page.screenshot({ fullPage: true, type: "jpeg", quality: 60 }),
        contentType: "image/jpeg",
      });

      if (LARGURAS_AXE.has(largura)) {
        const resultado = await new AxeBuilder({ page }).withTags(TAGS_WCAG).analyze();
        for (const violacao of resultado.violations) {
          if (!IMPACTOS.has(violacao.impact ?? "")) continue;
          const alvos = violacao.nodes.slice(0, 3).map((no) => no.target.join(" "));
          anotar(violacao.id, `${largura}px (${violacao.impact}): ${alvos.join(" | ")}`);
        }
      }
    }

    const previstas = new Set(EXCECOES.filter((e) => e.tela === tela.nome).map((e) => e.regra));
    const novas = [...encontradas]
      .filter(([regra]) => !previstas.has(regra))
      .map(([regra, onde]) => `${regra} → ${onde.join("; ")}`);
    const obsoletas = [...previstas].filter((regra) => !encontradas.has(regra));

    expect(novas, "violações novas (corrija a tela ou registre em excecoes-a11y.ts)").toEqual([]);
    expect(obsoletas, "exceções que não acontecem mais (apague de excecoes-a11y.ts)").toEqual([]);
  });
}
