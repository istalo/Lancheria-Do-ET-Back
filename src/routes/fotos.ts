import { prisma } from '../../lib/prisma'
import { Router } from 'express'
import { verificaToken, verificaAdmin } from '../middlewares/verificaToken'

const router = Router()

router.get("/", async (req, res) => {
  try {
    const fotos = await prisma.foto.findMany({
      select: {
        id: true,
        url: true,
        descricao: true,
        itemId: true
      }
    })
    res.status(200).json(fotos)
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar fotos." })
  }
})

router.post("/", verificaToken, verificaAdmin, async (req, res) => {
  const { url, descricao, itemId } = req.body

  try {
    const novaFoto = await prisma.foto.create({
      data: {
        url,
        descricao,
        itemId
      }
    })
    res.status(201).json(novaFoto)
  } catch (error) {
    res.status(500).json({ erro: "Erro ao cadastrar foto." })
  }
})

router.put("/:id", verificaToken, verificaAdmin, async (req, res) => {
  const { id } = req.params
  const { url, descricao, itemId } = req.body

  try {
    const fotoAtualizada = await prisma.foto.update({
      where: { id: Number(id) },
      data: { url, descricao, itemId }
    })
    res.status(200).json(fotoAtualizada)
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar foto." })
  }
})

router.delete("/:id", verificaToken, verificaAdmin, async (req, res) => {
  const { id } = req.params
  try {
    const fotoDeletada = await prisma.foto.delete({
      where: { id: Number(id) }
    })
    res.status(200).json(fotoDeletada)
  } catch (error) {
    res.status(500).json({ erro: "Erro ao deletar foto." })
  }
})

export default router