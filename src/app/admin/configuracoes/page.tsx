import type { Metadata } from "next";
import { FormularioConfiguracoes } from "@/components/admin/formulario-configuracoes";
import { lerConfiguracao } from "@/modules/settings";
import { salvarConfiguracaoAcao } from "./actions";

export const metadata: Metadata = { title: "Configurações · Administração · Kolô" };

// RF31: o layout do admin já barra quem não é ADMIN; salvar confere de novo no servidor.
export default async function PaginaConfiguracoes() {
  const configuracao = await lerConfiguracao();
  return (
    <>
      <h1 className="mb-2 font-display text-2xl">Configurações do site</h1>
      <p className="mb-6 max-w-2xl">
        Contato, horários e textos que aparecem no rodapé, na home, na página de contato, nas
        políticas e na mensagem do WhatsApp. O texto das políticas é revisado pela equipe e fica no
        código.
      </p>
      <FormularioConfiguracoes configuracao={configuracao} salvar={salvarConfiguracaoAcao} />
    </>
  );
}
