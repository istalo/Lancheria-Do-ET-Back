/*
  Warnings:

  - The values [PRONTO] on the enum `StatusPedido` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StatusPedido_new" AS ENUM ('RECEBIDO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'CANCELADO');
ALTER TABLE "public"."Pedido" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Pedido" ALTER COLUMN "status" TYPE "StatusPedido_new" USING ("status"::text::"StatusPedido_new");
ALTER TYPE "StatusPedido" RENAME TO "StatusPedido_old";
ALTER TYPE "StatusPedido_new" RENAME TO "StatusPedido";
DROP TYPE "public"."StatusPedido_old";
ALTER TABLE "Pedido" ALTER COLUMN "status" SET DEFAULT 'RECEBIDO';
COMMIT;
