const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO = 5 * 1024 * 1024;

export type ResultadoValidacao =
  { ok: true } | { ok: false; motivo: "tipo_invalido" | "tamanho_invalido" };

export function validarImagem(arquivo: { tipo: string; tamanho: number }): ResultadoValidacao {
  if (!TIPOS_ACEITOS.includes(arquivo.tipo)) return { ok: false, motivo: "tipo_invalido" };
  if (
    !Number.isInteger(arquivo.tamanho) ||
    arquivo.tamanho <= 0 ||
    arquivo.tamanho > TAMANHO_MAXIMO
  )
    return { ok: false, motivo: "tamanho_invalido" };
  return { ok: true };
}
