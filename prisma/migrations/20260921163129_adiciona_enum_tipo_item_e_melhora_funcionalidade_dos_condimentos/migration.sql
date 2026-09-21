/*
  Warnings:

  - A unique constraint covering the columns `[item_id,condimento_id]` on the table `lanche_condimentos` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TipoItem" AS ENUM ('LANCHE', 'BEBIDA');

-- AlterTable
ALTER TABLE "itens" ADD COLUMN     "categoria" "TipoItem" NOT NULL DEFAULT 'LANCHE';

-- CreateIndex
CREATE UNIQUE INDEX "lanche_condimentos_item_id_condimento_id_key" ON "lanche_condimentos"("item_id", "condimento_id");
