-- CreateEnum
CREATE TYPE "Pagamento" AS ENUM ('PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'DINHEIRO');

-- CreateEnum
CREATE TYPE "NivelAcesso" AS ENUM ('CLIENTE', 'ADMIN');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nivel_acesso" "NivelAcesso" NOT NULL,

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
CREATE TABLE "lanches" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo_id" INTEGER NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "lanches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos" (
    "id" SERIAL NOT NULL,
    "lanche_id" INTEGER NOT NULL,
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
    "lanche_id" INTEGER NOT NULL,
    "condimento_id" INTEGER NOT NULL,

    CONSTRAINT "lanche_condimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" SERIAL NOT NULL,
    "lanche_id" INTEGER NOT NULL,
    "clientetabela_id" INTEGER NOT NULL,
    "resposta" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" INTEGER NOT NULL,
    "pagamento" "Pagamento" NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_tabela_usuario_id_key" ON "clientes_tabela"("usuario_id");

-- AddForeignKey
ALTER TABLE "clientes_tabela" ADD CONSTRAINT "clientes_tabela_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lanches" ADD CONSTRAINT "lanches_tipo_id_fkey" FOREIGN KEY ("tipo_id") REFERENCES "tipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_lanche_id_fkey" FOREIGN KEY ("lanche_id") REFERENCES "lanches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lanche_condimentos" ADD CONSTRAINT "lanche_condimentos_lanche_id_fkey" FOREIGN KEY ("lanche_id") REFERENCES "lanches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lanche_condimentos" ADD CONSTRAINT "lanche_condimentos_condimento_id_fkey" FOREIGN KEY ("condimento_id") REFERENCES "condimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_lanche_id_fkey" FOREIGN KEY ("lanche_id") REFERENCES "lanches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_clientetabela_id_fkey" FOREIGN KEY ("clientetabela_id") REFERENCES "clientes_tabela"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
