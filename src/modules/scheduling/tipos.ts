export type OpcaoWizard = { id: string; nome: string };
export type OpcoesWizard = {
  artistas: (OpcaoWizard & { estilos: OpcaoWizard[] })[];
  tamanhos: OpcaoWizard[];
};
export type ResultadoWizard<T> = { ok: true; dados: T } | { ok: false; mensagem: string };
