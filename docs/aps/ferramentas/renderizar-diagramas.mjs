// APS: converte os diagramas SVG de docs/aps/midia/diagramas/ em PNG (2x), que o pandoc embute no
// .docx. Usa o Chromium do Playwright, já instalado para o E2E. Na raiz do repositório:
//
//   node docs/aps/ferramentas/renderizar-diagramas.mjs
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { chromium } from "@playwright/test";

const pasta = "docs/aps/midia/diagramas";
const navegador = await chromium.launch();
const pagina = await navegador.newPage({ deviceScaleFactor: 2 });
for (const arquivo of readdirSync(pasta).filter((nome) => nome.endsWith(".svg"))) {
  const svg = readFileSync(join(pasta, arquivo), "utf8");
  const largura = Number(/width="(\d+)"/.exec(svg)?.[1]);
  const altura = Number(/height="(\d+)"/.exec(svg)?.[1]);
  await pagina.setViewportSize({ width: largura, height: altura });
  await pagina.setContent(`<body style="margin:0">${svg}</body>`);
  const saida = join(pasta, arquivo.replace(/\.svg$/, ".png"));
  await pagina.locator("svg").screenshot({ path: saida });
  console.log(saida);
}
await navegador.close();
