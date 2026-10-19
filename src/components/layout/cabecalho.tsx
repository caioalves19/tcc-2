"use client";

import { useState } from "react";

import { Menu, ShoppingBag, X } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Marca } from "@/components/layout/marca";

// Navegação compartilhada entre o menu desktop e mobile.
const LINKS = [
  { rotulo: "Início", href: "/" },
  { rotulo: "Obras", href: "/obras" },
  { rotulo: "Tatuagem", href: "/tatuagens" },
  { rotulo: "Agendar", href: "/agendamento" },
  { rotulo: "Contato", href: "/contato" },
] as const;

type PropsConta = {
  logado?: boolean;
  administrador?: boolean;
  // ARTISTA ou ADMIN: agenda e portfólio. O acesso é conferido no servidor.
  equipe?: boolean;
  acaoSair?: () => Promise<void>;
};

// Entrar é link para /login; Sair é um form que dispara a Server Action de logout.
function AcaoConta({
  logado = false,
  administrador = false,
  equipe = false,
  acaoSair,
  className,
}: PropsConta & { className?: string }) {
  if (logado) {
    return (
      <div className={className}>
        {equipe && (
          <a
            href="/agenda"
            className={buttonVariants({ size: "sm", variant: "contorno", className: "px-2" })}
          >
            Agenda
          </a>
        )}
        {equipe && (
          <a
            href="/portfolio/gestao"
            className={buttonVariants({ size: "sm", variant: "contorno", className: "px-2" })}
          >
            Portfólio
          </a>
        )}
        {administrador && (
          <a
            href="/admin"
            className={buttonVariants({ size: "sm", variant: "contorno", className: "px-2" })}
          >
            Administração
          </a>
        )}
        <a
          href="/conta"
          className={buttonVariants({ size: "sm", variant: "contorno", className: "px-2" })}
        >
          Minha conta
        </a>
        <form action={acaoSair}>
          <Button type="submit" size="sm" variant="contorno" className="w-full px-2">
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
  equipe = false,
  acaoSair,
  itensNoCarrinho = 0,
}: PropsConta & { itensNoCarrinho?: number }) {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    // Fora da impressão: o relatório de vendas (PBI-48) sai só com o conteúdo.
    <header className="sticky top-0 z-50 border-b-2 border-neutro-grafite bg-[var(--kolo-fundo)] print:hidden">
      <div className="mx-auto flex h-20 max-w-pagina items-center justify-between gap-4 px-margem md:px-margem-desktop">
        <a
          href="/"
          className="shrink-0 rounded-campo focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Marca preload />
        </a>

        <nav aria-label="Navegação principal" className="hidden items-center xl:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-campo px-2 py-2 font-display text-selo uppercase text-[var(--kolo-texto)] hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {link.rotulo}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
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
            equipe={equipe}
            acaoSair={acaoSair}
            className="hidden items-center gap-2 xl:inline-flex"
          />
          <Button
            variant="contorno"
            size="icon-sm"
            className="xl:hidden"
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
          className="border-t-2 border-neutro-grafite bg-[var(--kolo-superficie)] px-margem py-4 xl:hidden"
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
            <li className="pt-2">
              <AcaoConta
                logado={logado}
                administrador={administrador}
                equipe={equipe}
                acaoSair={acaoSair}
                className="flex flex-wrap items-center gap-2"
              />
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
