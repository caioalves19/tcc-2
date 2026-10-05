"use client";

import { useState } from "react";

import { Menu, ShoppingBag, X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Marca } from "@/components/layout/marca";

// Itens do menu. O escopo do agendamento e das páginas de artista ainda está
// em discussão (docs/escopo-v2.2), então a lista mora aqui e muda em um lugar só.
const LINKS = [
  { rotulo: "Início", href: "/" },
  { rotulo: "Obras", href: "/obras" },
  { rotulo: "Tatuagem", href: "/tatuagem" },
  { rotulo: "Contato", href: "/contato" },
] as const;

type PropsConta = {
  logado?: boolean;
  acaoSair?: () => Promise<void>;
};

// Entrar é link para /login; Sair é um form que dispara a Server Action de logout.
function AcaoConta({ logado = false, acaoSair, className }: PropsConta & { className?: string }) {
  if (logado) {
    return (
      <div className={className}>
        <a
          href="/conta"
          className={buttonVariants({ size: "sm", variant: "contorno", className: "mr-2" })}
        >
          Minha conta
        </a>
        <form action={acaoSair}>
          <Button type="submit" size="sm" variant="contorno" className="w-full">
            Sair
          </Button>
        </form>
      </div>
    );
  }
  return (
    <a href="/login" className={buttonVariants({ size: "sm", className })}>
      Entrar
    </a>
  );
}

export function Cabecalho({ logado = false, acaoSair }: PropsConta) {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-neutro-grafite bg-[var(--kolo-fundo)]">
      <div className="mx-auto flex h-20 max-w-pagina items-center justify-between gap-4 px-margem md:px-margem-desktop">
        <a href="/" className="rounded-campo focus-visible:ring-3 focus-visible:ring-ring/50">
          <Marca preload />
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
          <AcaoConta logado={logado} acaoSair={acaoSair} className="hidden sm:inline-flex" />
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
              <AcaoConta logado={logado} acaoSair={acaoSair} className="w-full" />
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
