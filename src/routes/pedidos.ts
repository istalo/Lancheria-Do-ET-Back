import { prisma } from '../../lib/prisma'
import { Pagamento } from '../../generated/prisma/enums'
import { Router } from 'express'
import { z } from 'zod'
import { TokenInterface, verificaToken, verificaAdmin } from '../middlewares/verificaToken'

const router = Router()

const pedidoSchema = z.object({
  itens: z.array(z.object({
    itemId: z.number().int().positive(),
    quantidade: z.number().int().positive().optional()
  })).min(1),
  clienteTabelaId: z.number().int().positive(),
  pagamento: z.enum(Pagamento)
})

const pedidoInclude = {
  itens: { include: { item: { include: { tipo: true, fotos: true } } } },
  clienteTabela: true
}

router.get("/", verificaToken, async (req: TokenInterface, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      where: req.nivelAcesso === "ADMIN" ? undefined : { usuarioId: req.usuarioId },
      include: pedidoInclude,
      orderBy: { data: "desc" }
    })
    res.status(200).json(pedidos)
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar pedidos." })
  }
})

router.post("/", verificaToken, async (req: TokenInterface, res) => {
  const valida = pedidoSchema.safeParse(req.body)
  if (!valida.success || !req.usuarioId) {
    res.status(400).json({ erro: valida.success ? "Usuário não identificado." : valida.error })
    return
  }

  try {
    const pedido = await prisma.pedido.create({
      data: {
        clienteTabelaId: valida.data.clienteTabelaId,
        pagamento: valida.data.pagamento,
        usuarioId: req.usuarioId,
        itens: {
          create: await Promise.all(valida.data.itens.map(async ({ itemId, quantidade = 1 }) => {
            const item = await prisma.item.findUnique({ where: { id: itemId } })
            if (!item || !item.disponivel) {
              throw new Error("Item indisponível")
            }
            return { itemId, quantidade, preco: item.preco }
          }))
        }
      },
      include: pedidoInclude
    })
    res.status(201).json(pedido)
  } catch (error) {
    res.status(400).json({ erro: "Erro ao criar pedido." })
  }
})

router.delete("/:id", verificaToken, verificaAdmin, async (req, res) => {
  try {
    const pedido = await prisma.pedido.delete({
      where: { id: Number(req.params.id) }
    })
    res.status(200).json(pedido)
  } catch (error) {
    res.status(400).json({ erro: "Erro ao deletar pedido." })
  }
})

export default router