"use client";

import { useState } from "react";

import { Menu, ShoppingBag, X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Marca } from "@/components/layout/marca";

// Navegação compartilhada entre o menu desktop e mobile.
const LINKS = [
  { rotulo: "Início", href: "/" },
  { rotulo: "Obras", href: "/obras" },
  // Bloco de tatuagem da home até o portfólio público ter rota própria.
  { rotulo: "Tatuagem", href: "/#tatuagem" },
  { rotulo: "Agendar", href: "/agendamento" },
  { rotulo: "Contato", href: "/contato" },
] as const;

type PropsConta = {
  logado?: boolean;
  administrador?: boolean;
  acaoSair?: () => Promise<void>;
};

// Entrar é link para /login; Sair é um form que dispara a Server Action de logout.
function AcaoConta({
  logado = false,
  administrador = false,
  acaoSair,
  className,
}: PropsConta & { className?: string }) {
  if (logado) {
    return (
      <div className={className}>
        {administrador && (
          <a
            href="/admin"
            className={buttonVariants({ size: "sm", variant: "contorno", className: "mr-2" })}
          >
            Administração
          </a>
        )}
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

export function Cabecalho({
  logado = false,
  administrador = false,
  acaoSair,
  itensNoCarrinho = 0,
}: PropsConta & { itensNoCarrinho?: number }) {
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
          {/* RF11: a contagem vem do servidor (layout), em unidades disponíveis. */}
          <a
            href="/carrinho"
            aria-label={
              itensNoCarrinho > 0
                ? `Carrinho, ${itensNoCarrinho} ${itensNoCarrinho === 1 ? "item" : "itens"}`
                : "Carrinho"
            }
            className={buttonVariants({
              variant: "contorno",
              size: "icon-sm",
              className: "relative",
            })}
          >
            <ShoppingBag aria-hidden />
            {itensNoCarrinho > 0 && (
              <span
                aria-hidden
                className="absolute -top-2 -right-2 grid min-w-5 place-items-center rounded-full border-2 border-neutro-grafite bg-atelie-amarelo px-1 font-display text-etiqueta text-neutro-grafite"
              >
                {itensNoCarrinho}
              </span>
            )}
          </a>
          <AcaoConta
            logado={logado}
            administrador={administrador}
            acaoSair={acaoSair}
            className="hidden sm:inline-flex"
          />
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
              <AcaoConta
                logado={logado}
                administrador={administrador}
                acaoSair={acaoSair}
                className="w-full"
              />
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
