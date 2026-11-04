/*
  Warnings:

  - A unique constraint covering the columns `[nome]` on the table `condimentos` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('RECEBIDO', 'EM_PREPARO', 'PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'CANCELADO');

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "status" "StatusPedido" NOT NULL DEFAULT 'RECEBIDO';

-- AlterTable
ALTER TABLE "condimentos" ADD COLUMN     "calorias_100g" DECIMAL(7,2),
ADD COLUMN     "carboidratos_100g" DECIMAL(7,2),
ADD COLUMN     "gorduras_100g" DECIMAL(7,2),
ADD COLUMN     "proteinas_100g" DECIMAL(7,2);

-- AlterTable
ALTER TABLE "lanche_condimentos" ADD COLUMN     "quantidade_gramas" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "condimentos_nome_key" ON "condimentos"("nome");
