-- CreateEnum
CREATE TYPE "Pagamento" AS ENUM ('PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'DINHEIRO');

-- CreateEnum
CREATE TYPE "NivelAcesso" AS ENUM ('CLIENTE', 'ADMIN');

-- CreateEnum
CREATE TYPE "TipoToken" AS ENUM ('ATUALIZAR', 'REDEFINIR_SENHA', 'VALIDACAO_EMAIL');

-- CreateEnum
CREATE TYPE "TipoItem" AS ENUM ('LANCHE', 'BEBIDA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nivelAcesso" "NivelAcesso" NOT NULL DEFAULT 'CLIENTE',

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes_tabela" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,

    CONSTRAINT "clientes_tabela_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "tipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo_id" INTEGER NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "categoria" "TipoItem" NOT NULL DEFAULT 'LANCHE',

    CONSTRAINT "itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL,
    "descricao" TEXT,
    "url" TEXT NOT NULL,

    CONSTRAINT "fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "condimentos" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "condimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lanche_condimentos" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL,
    "condimento_id" INTEGER NOT NULL,

    CONSTRAINT "lanche_condimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" SERIAL NOT NULL,
    "clientetabela_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "pagamento" "Pagamento" NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,
    "entregue" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoItem" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "preco" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "PedidoItem_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_tabela_usuario_id_key" ON "clientes_tabela"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "lanche_condimentos_item_id_condimento_id_key" ON "lanche_condimentos"("item_id", "condimento_id");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_token_key" ON "tokens"("token");

-- AddForeignKey
ALTER TABLE "clientes_tabela" ADD CONSTRAINT "clientes_tabela_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens" ADD CONSTRAINT "itens_tipo_id_fkey" FOREIGN KEY ("tipo_id") REFERENCES "tipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "itens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lanche_condimentos" ADD CONSTRAINT "lanche_condimentos_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "itens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lanche_condimentos" ADD CONSTRAINT "lanche_condimentos_condimento_id_fkey" FOREIGN KEY ("condimento_id") REFERENCES "condimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_clientetabela_id_fkey" FOREIGN KEY ("clientetabela_id") REFERENCES "clientes_tabela"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "itens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
