// Contato público do Kolô num lugar só: rodapé, políticas e o que vier depois.
// O PBI-39 (RF31) leva estes valores para as configurações do site.
export const CONTATO = {
  email: "ateliekolo@gmail.com",
  whatsapp: "https://wa.me/5511950901191",
} as const;

// Sem API oficial do WhatsApp (ESCOPO): só o wa.me do ateliê, com a mensagem já escrita.
export function linkWhatsApp(mensagem: string): string {
  return `${CONTATO.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}
