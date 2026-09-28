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

const novoLancheCompletoSchema = z.object({
  nome: z.string().trim().min(1),
  descricao: z.string().trim().max(500).optional(),
  preco: z.number().positive(),
  tipo: z.string().trim().min(1),
  imagemUrl: z.url(),
  condimentos: z.array(z.string().trim().min(1)).default([]),
  categoria: z.enum(TipoItem).default(TipoItem.LANCHE)
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

router.post("/completo", verificaToken, verificaAdmin, async (req, res) => {
  const valida = novoLancheCompletoSchema.safeParse(req.body)

  if (!valida.success) {
    res.status(400).json({ erro: valida.error.issues })
    return
  }

  const dados = valida.data
  const condimentos = [...new Map(
    dados.condimentos.map(nome => [nome.toLocaleLowerCase(), nome])
  ).values()]

  if (dados.categoria === TipoItem.BEBIDA && condimentos.length > 0) {
    res.status(400).json({ erro: "Bebidas não podem receber condimentos." })
    return
  }

  try {
    const lanche = await prisma.$transaction(async (tx) => {
      const tipoExistente = await tx.tipo.findFirst({
        where: { nome: { equals: dados.tipo, mode: 'insensitive' } }
      })

      const tipo = tipoExistente ?? await tx.tipo.create({
        data: { nome: dados.tipo }
      })

      const item = await tx.item.create({
        data: {
          nome: dados.nome,
          descricao: dados.descricao || null,
          preco: dados.preco,
          tipoId: tipo.id,
          categoria: dados.categoria,
          disponivel: true
        }
      })

      await tx.foto.create({
        data: {
          itemId: item.id,
          url: dados.imagemUrl,
          descricao: dados.descricao || null
        }
      })

      for (const nome of condimentos) {
        const condimentoExistente = await tx.condimento.findFirst({
          where: { nome: { equals: nome, mode: 'insensitive' } }
        })

        const condimento = condimentoExistente ?? await tx.condimento.create({
          data: { nome }
        })

        await tx.lancheCondimento.create({
          data: {
            itemId: item.id,
            condimentoId: condimento.id
          }
        })
      }

      return tx.item.findUnique({
        where: { id: item.id },
        include: {
          tipo: true,
          fotos: true,
          condimentos: { include: { condimento: true } }
        }
      })
    })

    res.status(201).json({
      mensagem: "Lanche adicionado com sucesso!",
      lanche
    })
  } catch (error) {
    console.error("ERRO AO CADASTRAR LANCHE COMPLETO:", error)
    res.status(500).json({ erro: "Erro ao cadastrar lanche." })
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

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id)

  if (!Number.isInteger(id)) {
    res.status(400).json({ erro: "Id inválido." })
    return
  }

  try {
    const lanche = await prisma.item.findUnique({
      where: { id },
      include: {
        tipo: true,
        fotos: true,
        condimentos: {
          include: { condimento: true }
        }
      }
    })

    if (!lanche) {
      res.status(404).json({ erro: "Lanche não encontrado." })
      return
    }

    res.status(200).json(lanche)
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar lanche." })
  }
})

export default router
