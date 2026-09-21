import { prisma } from '../../lib/prisma'
import { Router } from 'express'
import { verificaToken, verificaAdmin } from '../middlewares/verificaToken'

const router = Router()

router.get("/", async (req, res) => {

  const itemId = req.query.itemId ? Number(req.query.itemId) : undefined

  try {
    const lanchesCondimentos = await prisma.lancheCondimento.findMany({
      where: itemId ? { itemId } : undefined,
      include: {
        condimento: true
      }
    })
    res.status(200).json(lanchesCondimentos)
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar condimentos do lanche." })
  }
})

router.post("/", verificaToken, verificaAdmin, async (req, res) => {
  const { itemId, condimentoId } = req.body

  try {
    const item = await prisma.item.findUnique({
      where: { id: Number(itemId) }
    })
    if (!item) {
      return res.status(404).json({ erro: "Item não encontrado." })
    }

    if (item.categoria === 'BEBIDA') {
      return res.status(400).json({ erro: "Não é possível adicionar condimentos a uma bebida." })
    }

    const lancheCondimento = await prisma.lancheCondimento.create({
      data: {
        itemId: Number(itemId),
        condimentoId: Number(condimentoId)
      },
      include: {
        condimento: true
      }
    })
    res.status(201).json(lancheCondimento)
  } catch (error) {
    res.status(400).json({ erro: "Erro ao vincular condimento ao item." })
  }
})

router.delete("/:id", verificaToken, verificaAdmin, async (req, res) => {
  try {
    const lancheCondimento = await prisma.lancheCondimento.delete({
      where: { id: Number(req.params.id) }
    })
    res.status(200).json(lancheCondimento)
  } catch (error) {
    res.status(400).json({ erro: "Erro ao remover condimento do lanche." })
  }
})

export default router