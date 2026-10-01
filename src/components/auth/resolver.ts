import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";

import type { ResultadoValidacaoDe } from "@/modules/identity";

// Liga o React Hook Form à mesma validação do servidor: o front só adianta o erro.
export function resolverDe<Entrada extends FieldValues, Dados extends object>(
  validar: (entrada: Entrada) => ResultadoValidacaoDe<Dados>,
): Resolver<Entrada, unknown, Dados> {
  return (valores) => {
    const resultado = validar(valores);
    if (resultado.ok) {
      return { values: resultado.dados, errors: {} };
    }
    const errors: FieldErrors<Entrada> = {};
    for (const [campo, mensagem] of Object.entries(resultado.campos)) {
      Object.assign(errors, { [campo]: { type: "validate", message: mensagem } });
    }
    return { values: {}, errors };
  };
}
