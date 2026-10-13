// Contato público do Kolô. Os valores vêm das configurações do site (PBI-39, RF31): o ADMIN muda
// em /admin/configuracoes, e sem nada salvo valem os padrões de src/modules/settings.

// Sem API oficial do WhatsApp (ESCOPO): só o wa.me do ateliê, com a mensagem já escrita.
export function hrefWhatsApp(numero: string): string {
  return `https://wa.me/${numero}`;
}

export function linkWhatsApp(mensagem: string, numero: string): string {
  return `${hrefWhatsApp(numero)}?text=${encodeURIComponent(mensagem)}`;
}

export function hrefInstagram(perfil: string): string {
  return `https://instagram.com/${perfil}`;
}
