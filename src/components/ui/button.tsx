// Componente do shadcn/ui adaptado à marca (PBI-10).
// As variantes leem os papéis --kolo-*, então o botão muda sozinho de cor,
// canto e sombra quando está dentro de um bloco data-brand="tattoo".
// Regras: docs/IDENTIDADE-VISUAL.md
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center bg-clip-padding font-display text-selo uppercase whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        // Ação principal: amarelo com sombra de adesivo no Ateliê, ouro em pílula no Tattoo.
        default:
          "rounded-[var(--kolo-raio-acao)] border-2 border-[var(--kolo-borda-acao)] bg-[var(--kolo-acao)] text-[var(--kolo-acao-texto)] shadow-[var(--kolo-sombra-acao)] hover:-translate-y-0.5 hover:shadow-[var(--kolo-sombra-acao-hover)] active:translate-y-0 active:shadow-[var(--kolo-sombra-acao)]",
        // Ação secundária: contorno sobre o fundo da página.
        contorno:
          "rounded-[var(--kolo-raio-acao)] border-2 border-[var(--kolo-contorno)] bg-transparent text-[var(--kolo-contorno-texto)] hover:bg-[var(--kolo-contorno)]/10",
        secondary:
          "rounded-[var(--kolo-raio-acao)] border border-transparent bg-secondary text-secondary-foreground hover:opacity-90",
        ghost:
          "rounded-campo border border-transparent hover:bg-accent hover:text-accent-foreground",
        destructive:
          "rounded-[var(--kolo-raio-acao)] border-2 border-destructive bg-transparent text-destructive hover:bg-destructive/10",
        link: "border border-transparent text-[var(--kolo-link)] underline-offset-4 hover:underline",
      },
      size: {
        // Alvo de toque de no mínimo 48px (RNF23).
        default: "h-12 gap-2 px-5",
        sm: "h-10 gap-1.5 px-4 text-etiqueta",
        lg: "h-14 gap-2.5 px-7",
        icon: "size-12",
        "icon-sm": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
