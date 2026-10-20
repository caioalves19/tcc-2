import { Marca } from "@/components/layout/marca";
import { hrefInstagram, hrefWhatsApp } from "@/lib/contato";
import type { ConfiguracaoSite } from "@/modules/settings";

const POLITICAS = [
  { rotulo: "Privacidade", href: "/politicas/privacidade" },
  { rotulo: "Termos de uso", href: "/politicas/termos" },
  { rotulo: "Política de cancelamento", href: "/politicas/cancelamento" },
] as const;

const TITULO = "font-display text-etiqueta uppercase text-atelie-amarelo";

// O rodapé é sempre grafite, nos dois modos: é o piso da marca. Contato, horários e a frase vêm
// das configurações do site (PBI-39), lidas pelo layout.
export function Rodape({ configuracao }: { configuracao: ConfiguracaoSite }) {
  const { contato, horarios, textos } = configuracao;
  const contatos = [
    { rotulo: contato.email, href: `mailto:${contato.email}` },
    { rotulo: "WhatsApp", href: hrefWhatsApp(contato.whatsapp) },
    { rotulo: `@${contato.instagramAtelie}`, href: hrefInstagram(contato.instagramAtelie) },
    { rotulo: `@${contato.instagramTattoo}`, href: hrefInstagram(contato.instagramTattoo) },
  ];
  return (
    <footer className="bg-neutro-grafite text-neutro-branco print:hidden">
      <div className="mx-auto flex max-w-pagina flex-col gap-10 px-margem py-12 md:flex-row md:justify-between md:px-margem-desktop">
        <div className="flex flex-col gap-3">
          <Marca variante="lettering" className="w-32" />
          <p className="max-w-xs text-nota text-neutro-linha">{textos.rodape}</p>
        </div>

        <nav aria-label="Contato" className="flex flex-col gap-3">
          <h2 className={TITULO}>Contato</h2>
          <ul className="flex flex-col gap-2">
            {contatos.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="break-all text-nota hover:underline">
                  {item.rotulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {horarios.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className={TITULO}>Horários</h2>
            <ul className="flex flex-col gap-2">
              {horarios.map((linha) => (
                <li key={linha} className="text-nota">
                  {linha}
                </li>
              ))}
            </ul>
          </div>
        )}

        <nav aria-label="Políticas" className="flex flex-col gap-3">
          <h2 className={TITULO}>Políticas</h2>
          <ul className="flex flex-col gap-2">
            {POLITICAS.map((politica) => (
              <li key={politica.href}>
                <a href={politica.href} className="text-nota hover:underline">
                  {politica.rotulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-neutro-ardosia">
        <p className="mx-auto max-w-pagina px-margem py-5 text-nota text-neutro-linha md:px-margem-desktop">
          © 2026 Kolô Ateliê &amp; Estúdio
        </p>
      </div>
    </footer>
  );
}
