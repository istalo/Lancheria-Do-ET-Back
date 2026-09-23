import { prisma } from '../../lib/prisma'
import { TipoItem } from '../../generated/prisma/enums'
import { Router } from 'express'
import { z } from 'zod'
import { verificaToken, verificaAdmin } from '../middlewares/verificaToken'

const router = Router()

const itemSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().nullable().optional(),
  tipoId: z.number().int().positive(),
  preco: z.number().nonnegative(),
  disponivel: z.boolean().optional(),
  categoria: z.enum(TipoItem).optional()
})

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
  const valida = itemSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  try {
    const tipo = await prisma.tipo.findUnique({
      where: { id: valida.data.tipoId }
    })

    if (!tipo) {
      res.status(400).json({ erro: "O tipo informado não existe." })
      return
    }

    const novoLanche = await prisma.item.create({
      data: {
        ...valida.data,
        disponivel: valida.data.disponivel ?? true,
        categoria: valida.data.categoria ?? TipoItem.LANCHE
      }
    })
    res.status(201).json(novoLanche)
  } catch (error) {
    console.error("ERRO AO CADASTRAR ITEM:", error)
    res.status(500).json({ erro: "Erro ao cadastrar lanche." })
  }
})

router.patch("/:id", verificaToken, verificaAdmin, async (req, res) => {
  const { id } = req.params
  const valida = itemSchema.partial().safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  try {
    const lancheAtualizado = await prisma.item.update({
      where: { id: Number(id) },
      data: valida.data
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