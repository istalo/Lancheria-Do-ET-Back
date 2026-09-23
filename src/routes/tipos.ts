import { prisma } from '../../lib/prisma'
import { Router } from 'express'
import { z } from 'zod'
import { verificaToken, verificaAdmin } from '../middlewares/verificaToken'

const router = Router()

const tipoSchema = z.object({
  nome: z.string().trim().min(1)
})

router.get('/', async (req, res) => {
  try {
    const tipos = await prisma.tipo.findMany({
      orderBy: { nome: 'asc' }
    })
    res.status(200).json(tipos)
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar tipos.' })
  }
})

router.post('/', verificaToken, verificaAdmin, async (req, res) => {
  const valida = tipoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.issues })
    return
  }

  try {
    const tipo = await prisma.tipo.create({
      data: valida.data
    })
    res.status(201).json(tipo)
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao cadastrar tipo.' })
  }
})

router.patch('/:id', verificaToken, verificaAdmin, async (req, res) => {
  const valida = tipoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.issues })
    return
  }

  try {
    const tipo = await prisma.tipo.update({
      where: { id: Number(req.params.id) },
      data: valida.data
    })
    res.status(200).json(tipo)
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao atualizar tipo.' })
  }
})

router.delete('/:id', verificaToken, verificaAdmin, async (req, res) => {
  try {
    const tipo = await prisma.tipo.delete({
      where: { id: Number(req.params.id) }
    })
    res.status(200).json(tipo)
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao deletar tipo. Verifique se existem itens usando este tipo.' })
  }
})

export default router