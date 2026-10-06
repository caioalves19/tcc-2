// Sem dependências de servidor: o componente de upload também importa este arquivo.
const COMUNS = {
  nao_autenticado: "Sua sessão expirou. Entre novamente.",
  artista_inexistente: "Artista não encontrado.",
};

export const MENSAGENS_UPLOAD: Record<string, string> = {
  ...COMUNS,
  entrada_invalida: "Dados do envio inválidos.",
  destino_invalido: "Destino de imagem inválido.",
  tipo_invalido: "Envie uma imagem JPEG, PNG ou WebP.",
  tamanho_invalido: "A imagem deve ter até 5 MB.",
  proibido: "Você não tem permissão para enviar imagens para este perfil.",
  indisponivel: "Não foi possível enviar agora. Tente novamente.",
};

export const MENSAGENS_PROCESSAMENTO: Record<string, string> = {
  ...COMUNS,
  chave_invalida: "Imagem inválida.",
  proibido: "Você não tem permissão para processar esta imagem.",
  imagem_invalida: "O arquivo enviado não é uma imagem JPEG, PNG ou WebP válida.",
  objeto_inexistente: "A imagem não chegou ao armazenamento. Envie o arquivo de novo.",
  indisponivel: "Não foi possível processar agora. Tente novamente.",
};
