import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  render,
  toPlainText,
} from "@react-email/components";

// Único template de produto nesta versão (ESCOPO, seção E-mail). Estilos inline:
// clientes de e-mail ignoram CSS externo. Cores da marca (docs/IDENTIDADE-VISUAL.md).
const GRAFITE = "#1a1a1a";
const AMARELO = "#ffd600";
const CINZA = "#5f6872";

type DadosRecuperacao = { nome: string; link: string };

function EmailRecuperacaoSenha({ nome, link }: DadosRecuperacao) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Redefina a senha da sua conta Kolô</Preview>
      <Body style={{ backgroundColor: "#f6f8fa", fontFamily: "Arial, sans-serif", color: GRAFITE }}>
        <Container style={{ maxWidth: "480px", padding: "32px 24px", backgroundColor: "#ffffff" }}>
          <Heading as="h1" style={{ fontSize: "22px", margin: "0 0 16px" }}>
            Redefinição de senha
          </Heading>
          <Text>Olá, {nome}.</Text>
          <Text>
            Recebemos um pedido para redefinir a senha da sua conta Kolô. O link vale por 1 hora e
            só pode ser usado uma vez.
          </Text>
          <Button
            href={link}
            style={{
              backgroundColor: AMARELO,
              color: GRAFITE,
              border: `2px solid ${GRAFITE}`,
              borderRadius: "8px",
              padding: "12px 20px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Redefinir senha
          </Button>
          <Text style={{ color: CINZA, fontSize: "14px" }}>
            Se o botão não abrir, copie este endereço no navegador: {link}
          </Text>
          <Text style={{ color: CINZA, fontSize: "14px" }}>
            Se você não pediu, ignore este e-mail: sua senha continua a mesma.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export type EmailRenderizado = { assunto: string; html: string; texto: string };

export async function renderizarRecuperacaoDeSenha(
  dados: DadosRecuperacao,
): Promise<EmailRenderizado> {
  const html = await render(<EmailRecuperacaoSenha {...dados} />);
  return { assunto: "Redefinição de senha · Kolô", html, texto: toPlainText(html) };
}
