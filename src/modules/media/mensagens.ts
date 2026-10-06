// Sem dependências de servidor: o componente de upload também importa este arquivo.
export const MENSAGENS_UPLOAD: Record<string, string> = {
  destino_invalido: "Destino de imagem inválido.",
  tipo_invalido: "Envie uma imagem JPEG, PNG ou WebP.",
  tamanho_invalido: "A imagem deve ter até 5 MB.",
  nao_autenticado: "Sua sessão expirou. Entre novamente.",
  proibido: "Você não tem permissão para enviar imagens para este perfil.",
  artista_inexistente: "Artista não encontrado.",
  indisponivel: "Não foi possível enviar agora. Tente novamente.",
};
