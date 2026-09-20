"use client";

import { useState } from "react";

import { Menu, ShoppingBag, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Marca } from "@/components/layout/marca";

// Itens do menu. O escopo do agendamento e das páginas de artista ainda está
// em discussão (docs/escopo-v2.2), então a lista mora aqui e muda em um lugar só.
const LINKS = [
  { rotulo: "Início", href: "/" },
  { rotulo: "Obras", href: "/obras" },
  { rotulo: "Tatuagem", href: "/tatuagem" },
  { rotulo: "Contato", href: "/contato" },
] as const;

export function Cabecalho() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-neutro-grafite bg-[var(--kolo-fundo)]">
      <div className="mx-auto flex h-20 max-w-pagina items-center justify-between gap-4 px-margem md:px-margem-desktop">
        <a href="/" className="rounded-campo focus-visible:ring-3 focus-visible:ring-ring/50">
          <Marca />
        </a>

        <nav aria-label="Navegação principal" className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-campo px-3 py-2 font-display text-selo uppercase text-[var(--kolo-texto)] hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {link.rotulo}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="contorno" size="icon-sm" aria-label="Carrinho">
            <ShoppingBag aria-hidden />
          </Button>
          <Button size="sm" className="hidden sm:inline-flex">
            Entrar
          </Button>
          <Button
            variant="contorno"
            size="icon-sm"
            className="lg:hidden"
            aria-expanded={menuAberto}
            aria-controls="menu-mobile"
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMenuAberto((aberto) => !aberto)}
          >
            {menuAberto ? <X aria-hidden /> : <Menu aria-hidden />}
          </Button>
        </div>
      </div>

      {menuAberto ? (
        <nav
          id="menu-mobile"
          aria-label="Menu mobile"
          className="border-t-2 border-neutro-grafite bg-[var(--kolo-superficie)] px-margem py-4 lg:hidden"
        >
          <ul className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuAberto(false)}
                  className="block rounded-campo px-3 py-3 font-display text-selo uppercase text-[var(--kolo-superficie-texto)] hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {link.rotulo}
                </a>
              </li>
            ))}
            <li className="pt-2 sm:hidden">
              <Button className="w-full">Entrar</Button>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
