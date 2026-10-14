// RF21 (PBI-33): a mensagem que o cliente envia ao estúdio no fim do wizard. O site só monta o
// texto e o link; quem envia é a própria pessoa, no WhatsApp. Nada é gravado (RN01, RNF18).

export type ConteudoMensagem = {
  nome: string;
  artista: string;
  estilo: string;
  regiao: string;
  tamanho: string;
  // AAAA-MM-DD e HH:MM, no horário de São Paulo (RN09), como o wizard recebe.
  data: string;
  horario: string;
  // Só chega aqui depois da validação dos três avisos (PBI-32).
  aceites: { anamnese: true; termo: true; maioridade: true };
};

export function mensagemAgendamento(conteudo: ConteudoMensagem): string {
  const data = conteudo.data.split("-").reverse().join("/");
  return [
    `Olá! Sou ${conteudo.nome} e quero agendar uma tatuagem com ${conteudo.artista}.`,
    `Estilo: ${conteudo.estilo}`,
    `Região do corpo: ${conteudo.regiao}`,
    `Tamanho: ${conteudo.tamanho}`,
    `Preferência: ${data} às ${conteudo.horario} (horário de São Paulo)`,
    "Li e aceito os avisos: anamnese e termo de consentimento presenciais e declaração de maioridade.",
  ].join("\n");
}
