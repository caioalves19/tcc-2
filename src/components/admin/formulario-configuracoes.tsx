"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ResultadoGestao } from "@/modules/artists";
import type { ConfiguracaoSite, EntradaConfiguracao } from "@/modules/settings";
import { CampoAdmin, FormularioAdmin, texto, useGestao } from "./formulario";

type Props = {
  configuracao: ConfiguracaoSite;
  // Server Action (salvarConfiguracaoAcao): o servidor valida e normaliza tudo.
  salvar: (entrada: EntradaConfiguracao) => Promise<ResultadoGestao<unknown>>;
};

const GRUPO = "grid gap-4 rounded-card border-2 border-[var(--kolo-contorno)] p-4";
const LEGENDA = "px-1 font-display text-lg";

// RF31 (PBI-39): o ADMIN edita contato, horários e os textos institucionais. O texto das
// políticas fica no código (revisado pela equipe, RNF17); só o contato citado nelas vem daqui.
export function FormularioConfiguracoes({ configuracao, salvar }: Props) {
  const { pendente, executar, feedback } = useGestao();
  const [salvamentos, setSalvamentos] = useState(0);
  const { contato, horarios, textos } = configuracao;
  // Os campos são recriados quando a página volta com o que ficou gravado (o servidor normaliza
  // e-mail, WhatsApp e Instagram); o aviso de "salvas" fica fora deles e continua na tela.
  const versao = `${salvamentos}:${JSON.stringify(configuracao)}`;
  return (
    <FormularioAdmin
      pendente={pendente}
      enviar={(dados) =>
        executar(
          () =>
            salvar({
              contato: {
                email: texto(dados, "email"),
                whatsapp: texto(dados, "whatsapp"),
                instagramAtelie: texto(dados, "instagramAtelie"),
                instagramTattoo: texto(dados, "instagramTattoo"),
              },
              horarios: texto(dados, "horarios"),
              textos: {
                apresentacao: texto(dados, "apresentacao"),
                tatuagem: texto(dados, "tatuagem"),
                murais: texto(dados, "murais"),
                rodape: texto(dados, "rodape"),
              },
            }),
          () => setSalvamentos((total) => total + 1),
          "Configurações salvas.",
        )
      }
    >
      <div key={versao} className="grid gap-4">
        <fieldset className={GRUPO}>
          <legend className={LEGENDA}>Contato</legend>
          <CampoAdmin nome="email" rotulo="E-mail" tipo="email" valor={contato.email} obrigatorio />
          <CampoAdmin
            nome="whatsapp"
            rotulo="WhatsApp (com 55 e DDD)"
            tipo="tel"
            valor={contato.whatsapp}
            obrigatorio
          />
          <CampoAdmin
            nome="instagramAtelie"
            rotulo="Instagram do ateliê"
            valor={contato.instagramAtelie}
            obrigatorio
          />
          <CampoAdmin
            nome="instagramTattoo"
            rotulo="Instagram do tattoo"
            valor={contato.instagramTattoo}
            obrigatorio
          />
        </fieldset>

        <fieldset className={GRUPO}>
          <legend className={LEGENDA}>Horários</legend>
          <CampoAdmin
            nome="horarios"
            rotulo="Horários (uma linha por item, até 4)"
            valor={horarios.join("\n")}
            longo
          />
          <p className="text-nota">Deixe em branco para não mostrar horários no site.</p>
        </fieldset>

        <fieldset className={GRUPO}>
          <legend className={LEGENDA}>Textos institucionais</legend>
          <CampoAdmin
            nome="apresentacao"
            rotulo="Apresentação da home"
            valor={textos.apresentacao}
            longo
            obrigatorio
          />
          <CampoAdmin
            nome="tatuagem"
            rotulo="Frase do bloco de tatuagem"
            valor={textos.tatuagem}
            longo
            obrigatorio
          />
          <CampoAdmin
            nome="murais"
            rotulo="Texto da faixa de murais"
            valor={textos.murais}
            longo
            obrigatorio
          />
          <CampoAdmin
            nome="rodape"
            rotulo="Frase do rodapé"
            valor={textos.rodape}
            longo
            obrigatorio
          />
        </fieldset>
      </div>

      <div>
        <Button type="submit">Salvar configurações</Button>
      </div>
      {feedback}
    </FormularioAdmin>
  );
}
