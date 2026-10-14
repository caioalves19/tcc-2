import { expect, it } from "vitest";
import { consultaDaBusca, palavrasDaBusca } from "@/lib/busca";

it("PBI-37/PBI-41 a busca fica só com letras e números, até 8 palavras de um texto de até 100 caracteres", () => {
  expect(palavrasDaBusca("  Metrópole & chamas | !grafite:* ")).toEqual([
    "Metrópole",
    "chamas",
    "grafite",
  ]);
  expect(palavrasDaBusca("&|!:*()")).toEqual([]);
  expect(palavrasDaBusca("a b c d e f g h i j")).toHaveLength(8);
  expect(palavrasDaBusca(`${"x".repeat(99)} longa`)).toEqual(["x".repeat(99)]);
});

it("PBI-37/PBI-41 cada palavra vale por começo e todas são obrigatórias", () => {
  expect(consultaDaBusca(["metro", "chamas"])).toBe("metro:* & chamas:*");
});
