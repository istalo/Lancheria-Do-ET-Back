import { prisma } from '../../lib/prisma'
import { Router } from 'express'
import { verificaToken, verificaAdmin } from '../middlewares/verificaToken'

const router = Router()

router.get("/", async (req, res) => {
  try {
    const lanches = await prisma.item.findMany({
      include: {
        tipo: true,
        fotos: true,
        condimentos: {
          include: { condimento: true }
        }
      }
    })
    res.status(200).json(lanches)
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar lanches." })
  }
})

router.post("/", verificaToken, verificaAdmin, async (req, res) => {
  const { nome, descricao, tipoId, preco, disponivel } = req.body

  try {
    const novoLanche = await prisma.item.create({
      data: {
        nome,
        descricao,
        tipoId,
        preco,
        disponivel
      }
    })
    res.status(201).json(novoLanche)
  } catch (error) {
    res.status(500).json({ erro: "Erro ao cadastrar lanche." })
  }
})

router.patch("/:id", verificaToken, verificaAdmin, async (req, res) => {
  const { id } = req.params
  const { nome, descricao, tipoId, preco, disponivel } = req.body

  try {
    const lancheAtualizado = await prisma.item.update({
      where: { id: Number(id) },
      data: {
        nome,
        descricao,
        tipoId,
        preco,
        disponivel
      }
    })
    res.status(200).json(lancheAtualizado)
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar lanche." })
  }
})

router.delete("/:id", verificaToken, verificaAdmin, async (req, res) => {
  const { id } = req.params

  try {
    const lancheDeletado = await prisma.item.delete({
      where: { id: Number(id) }
    })
    res.status(200).json(lancheDeletado)
  } catch (error) {
    res.status(500).json({ erro: "Erro ao deletar lanche." })
  }
})

export default router