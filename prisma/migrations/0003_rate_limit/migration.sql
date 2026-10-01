-- Contador de tentativas por janela (RNF08). A chave já chega com hash: não guarda e-mail nem IP legíveis.
CREATE TABLE "rate_limit" (
    "chave" TEXT NOT NULL,
    "tentativas" INTEGER NOT NULL,
    "janela_inicio" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("chave"),
    CONSTRAINT "rate_limit_tentativas_positivas" CHECK ("tentativas" > 0)
);
