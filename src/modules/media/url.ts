export function urlPublica(chave: string): string {
  const base = process.env.R2_PUBLIC_URL;
  if (base === undefined || base.trim() === "") throw new Error("R2_PUBLIC_URL ausente");
  return `${base.replace(/\/+$/, "")}/${chave}`;
}
