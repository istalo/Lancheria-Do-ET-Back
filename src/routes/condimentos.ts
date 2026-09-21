import { prisma } from '../../lib/prisma'
import { Router } from 'express'
import { verificaToken, verificaAdmin } from '../middlewares/verificaToken'

const router = Router()

router.get("/", async (req, res) => {
  try {
    const condimentos = await prisma.condimento.findMany({
      select: {
        id: true,
        nome: true
      }
    })
    res.status(200).json(condimentos)
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar condimentos." })
  }
})

router.post("/", verificaToken, verificaAdmin, async (req, res) => {
  const { nome } = req.body

  try {
    const novoCondimento = await prisma.condimento.create({
      data: {
        nome
      }
    })
    res.status(201).json(novoCondimento)
  } catch (error) {
    res.status(500).json({ erro: "Erro ao cadastrar condimento." })
  }
})

router.put("/:id", verificaToken, verificaAdmin, async (req, res) => {
  const { id } = req.params
  const { nome } = req.body

  try {
    const condimentoAtualizado = await prisma.condimento.update({
      where: { id: Number(id) },
      data: { nome }
    })
    res.status(200).json(condimentoAtualizado)
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar condimento." })
  }
})

router.delete("/:id", verificaToken, verificaAdmin, async (req, res) => {
  const { id } = req.params
  try {
    const condimentoDeletado = await prisma.condimento.delete({
      where: { id: Number(id) }
    })
    res.status(200).json(condimentoDeletado)
  } catch (error) {
    res.status(500).json({ erro: "Erro ao deletar condimento." })
  }
})

export default router