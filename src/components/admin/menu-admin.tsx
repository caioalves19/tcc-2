"use client";

import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";

const ITENS = [
  { rotulo: "Painel", href: "/admin" },
  { rotulo: "Relatório", href: "/admin/relatorio" },
  { rotulo: "Pedidos", href: "/admin/pedidos" },
  { rotulo: "Clientes", href: "/admin/clientes" },
  { rotulo: "Obras", href: "/admin/obras" },
  { rotulo: "Artistas", href: "/admin/artistas" },
  { rotulo: "Estilos", href: "/admin/estilos" },
  { rotulo: "Tags", href: "/admin/tags" },
  { rotulo: "Configurações", href: "/admin/configuracoes" },
] as const;

// O Painel é só a página inicial; os outros itens valem também para as telas de dentro (o detalhe
// do pedido marca "Pedidos").
function ehAtual(href: string, caminho: string): boolean {
  return href === "/admin" ? caminho === href : caminho === href || caminho.startsWith(`${href}/`);
}

// Menu da área administrativa, com o visual dos botões do site e a tela atual marcada (PBI-48).
export function MenuAdmin() {
  const caminho = usePathname();
  return (
    <nav aria-label="Administração" className="mb-8 print:hidden">
      <ul className="flex flex-wrap gap-2">
        {ITENS.map((item) => {
          const atual = ehAtual(item.href, caminho);
          return (
            <li key={item.href}>
              <a
                href={item.href}
                aria-current={atual ? "page" : undefined}
                className={buttonVariants({ variant: atual ? "default" : "contorno", size: "sm" })}
              >
                {item.rotulo}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
