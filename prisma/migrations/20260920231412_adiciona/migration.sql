-- CreateEnum
CREATE TYPE "TipoToken" AS ENUM ('ATUALIZAR', 'REDEFINIR_SENHA', 'VALIDACAO_EMAIL');

-- CreateTable
CREATE TABLE "tokens" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "tipoToken" "TipoToken" NOT NULL,
    "criado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira" TIMESTAMP(3) NOT NULL,
    "revogado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_token_key" ON "tokens"("token");

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
