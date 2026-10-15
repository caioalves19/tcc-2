import { obterPrisma } from "../../lib/prisma";
import { comoAdmin, validar } from "../artists/index";
import {
  CHAVES,
  configuracaoDoBanco,
  PADRAO,
  schemaEntradaConfiguracao,
  type ConfiguracaoSite,
} from "./configuracao";

// RF31: leitura pública, sem login, para o layout e as páginas. Se o banco falhar, o site segue
// no ar com os valores padrão (o mesmo cuidado do layout com a sessão e o carrinho).
export async function lerConfiguracao(): Promise<ConfiguracaoSite> {
  try {
    const linhas = await obterPrisma().siteSetting.findMany({
      where: { key: { in: [...CHAVES] } },
    });
    return configuracaoDoBanco(linhas.map((linha) => ({ chave: linha.key, valor: linha.value })));
  } catch (erro) {
    console.error(
      "Falha ao ler as configurações do site",
      erro instanceof Error ? erro.name : "erro desconhecido",
    );
    return structuredClone(PADRAO);
  }
}

// RF31: só o ADMIN salva (comoAdmin relê sessão e papel no banco). A entrada é validada inteira
// antes de gravar qualquer chave; cada chave é uma linha de site_setting.
export function salvarConfiguracao(entrada: unknown, cabecalhos: Headers) {
  return comoAdmin(cabecalhos, async (tx): Promise<ConfiguracaoSite> => {
    const dados = validar(schemaEntradaConfiguracao, entrada);
    for (const chave of CHAVES)
      await tx.siteSetting.upsert({
        where: { key: chave },
        create: { key: chave, value: dados[chave] },
        update: { value: dados[chave] },
      });
    return dados;
  });
}
