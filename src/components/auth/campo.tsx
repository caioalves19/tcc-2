import type { UseFormRegisterReturn } from "react-hook-form";

// Campo de formulário com rótulo e erro ligados por aria (padrão das telas de conta).
export function Campo({
  id,
  rotulo,
  tipo,
  autoComplete,
  erro,
  registro,
}: {
  id: string;
  rotulo: string;
  tipo: string;
  autoComplete: string;
  erro: string | undefined;
  registro: UseFormRegisterReturn;
}) {
  const idErro = `${id}-erro`;
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-nota font-semibold">
        {rotulo}
      </label>
      <input
        id={id}
        type={tipo}
        autoComplete={autoComplete}
        aria-invalid={erro !== undefined}
        aria-describedby={erro !== undefined ? idErro : undefined}
        className="h-12 rounded-campo border-2 border-[var(--kolo-contorno)] bg-transparent px-4 text-corpo outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
        {...registro}
      />
      {erro !== undefined && (
        <p id={idErro} role="alert" className="text-nota text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}

export function AvisoErro({ mensagem }: { mensagem: string | undefined }) {
  if (mensagem === undefined) {
    return null;
  }
  return (
    <p role="alert" className="text-nota text-destructive">
      {mensagem}
    </p>
  );
}
