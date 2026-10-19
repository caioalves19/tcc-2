// PBI-45 (E2E): dublê do R2 no processo do servidor, carregado por NODE_OPTIONS=--import como o
// do Mercado Pago. O Next deixa o @aws-sdk/client-s3 fora do bundle e o carrega por require
// (.next/node_modules aponta para o mesmo pacote), então trocar o S3Client.prototype.send aqui
// vale para o app. GetObject, PutObject e DeleteObject usam a pasta E2E_R2_DIR, onde o
// page.route grava o que o navegador envia; o sharp processa o arquivo de verdade. A URL
// assinada continua sendo gerada pelo SDK, sem rede.
//
// Carregado pelo strip de tipos do Node, fora do bundler: sem imports de "@/..." nem caminhos
// sem extensão.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

type Comando = { input: { Key?: string; Body?: unknown } };
type ClienteS3 = { send: (comando: Comando) => Promise<unknown> };
// Só para o instanceof: o tipo da instância não importa aqui.
type Construtor = new (...args: never[]) => object;
type ModuloS3 = {
  S3Client: { prototype: ClienteS3 };
  GetObjectCommand: Construtor;
  PutObjectCommand: Construtor;
  DeleteObjectCommand: Construtor;
};

const pasta = process.env.E2E_R2_DIR;
if (pasta) {
  const s3 = createRequire(import.meta.url)("@aws-sdk/client-s3") as ModuloS3;
  const enviarReal = s3.S3Client.prototype.send;

  s3.S3Client.prototype.send = async function (this: ClienteS3, comando: Comando) {
    const chave = comando.input.Key;
    if (!chave) return enviarReal.call(this, comando);
    const arquivo = join(pasta, chave);

    if (comando instanceof s3.GetObjectCommand) {
      // Como o SDK: objeto ausente vira um erro com name "NoSuchKey".
      if (!existsSync(arquivo))
        throw Object.assign(new Error("The specified key does not exist."), { name: "NoSuchKey" });
      const conteudo = readFileSync(arquivo);
      return { Body: { transformToByteArray: async () => new Uint8Array(conteudo) } };
    }
    if (comando instanceof s3.PutObjectCommand) {
      mkdirSync(dirname(arquivo), { recursive: true });
      writeFileSync(arquivo, comando.input.Body as Uint8Array);
      return {};
    }
    if (comando instanceof s3.DeleteObjectCommand) {
      rmSync(arquivo, { force: true });
      return {};
    }
    // O E2E é fechado: nenhum comando com chave vai ao R2 de verdade.
    throw new Error("Comando do S3 não simulado no E2E.");
  };
}
