import { Marca } from "@/components/layout/marca";

const POLITICAS = [
  { rotulo: "Privacidade", href: "/politicas/privacidade" },
  { rotulo: "Termos de uso", href: "/politicas/termos" },
  { rotulo: "Política de cancelamento", href: "/politicas/cancelamento" },
] as const;

const CONTATOS = [
  { rotulo: "ateliekolo@gmail.com", href: "mailto:ateliekolo@gmail.com" },
  { rotulo: "WhatsApp", href: "https://wa.me/5511950901191" },
  { rotulo: "@koloatelie", href: "https://instagram.com/koloatelie" },
  { rotulo: "@kolotattoo", href: "https://instagram.com/kolotattoo" },
] as const;

// O rodapé é sempre grafite, nos dois modos: é o piso da marca.
export function Rodape() {
  return (
    <footer className="bg-neutro-grafite text-neutro-branco">
      <div className="mx-auto flex max-w-pagina flex-col gap-10 px-margem py-12 md:flex-row md:justify-between md:px-margem-desktop">
        <div className="flex flex-col gap-3">
          <Marca className="[--kolo-texto:var(--color-neutro-branco)] [--kolo-texto-suave:var(--color-neutro-linha)]" />
          <p className="max-w-xs text-nota text-neutro-linha">
            Arte urbana autêntica, feita por pessoas reais. São Paulo.
          </p>
        </div>

        <nav aria-label="Contato" className="flex flex-col gap-3">
          <h2 className="font-display text-etiqueta uppercase text-atelie-amarelo">Contato</h2>
          <ul className="flex flex-col gap-2">
            {CONTATOS.map((contato) => (
              <li key={contato.href}>
                <a href={contato.href} className="text-nota hover:underline">
                  {contato.rotulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Políticas" className="flex flex-col gap-3">
          <h2 className="font-display text-etiqueta uppercase text-atelie-amarelo">Políticas</h2>
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
