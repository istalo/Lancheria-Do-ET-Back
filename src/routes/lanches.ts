import { prisma } from "../../lib/prisma";
import { TipoItem } from "../../generated/prisma/enums";
import { Router } from "express";
import { z } from "zod";
import {
  verificaToken,
  verificaAdmin,
  verificaCliente,
} from "../middlewares/verificaToken";
import {
  unificaIngredientes,
  estimaNutricoesFaltantes,
  vinculaIngredientes,
} from "../services/ingredientes";
import { calculaTabela } from "../services/tabelaNutricional";

const router = Router();

const itemSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().nullable().optional(),
  tipoId: z.number().int().positive(),
  preco: z.number().nonnegative(),
  disponivel: z.boolean().optional(),
  destaque: z.boolean().optional(),
  categoria: z.enum(TipoItem).optional(),
});

const ingredienteSchema = z.object({
  nome: z.string().trim().min(1),
  quantidadeGramas: z.number().int().positive(),
});

const novoLancheCompletoSchema = z.object({
  nome: z.string().trim().min(1),
  descricao: z.string().trim().max(500).optional(),
  preco: z.number().positive(),
  tipo: z.string().trim().min(1),
  imagemUrl: z.url(),
  condimentos: z.array(ingredienteSchema).default([]),
  categoria: z.enum(TipoItem).default(TipoItem.LANCHE),
});

const avaliacaoSchema = z.object({
  nota: z.number().int().min(1).max(5),
  comentario: z.string().trim().max(1000).optional(),
});

router.get("/admin", async (req, res) => {
  try {
    const lanches = await prisma.item.findMany({
      orderBy: { id: "desc" },
      include: {
        tipo: true,
        fotos: true,
        condimentos: {
          include: { condimento: true },
        },
      },
    });
    res.status(200).json(lanches);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar lanches." });
  }
});

router.get("/", async (req, res) => {
  try {
    const lanches = await prisma.item.findMany({
      where: { disponivel: true },
      orderBy: { id: "desc" },
      include: {
        tipo: true,
        fotos: true,
        condimentos: {
          include: { condimento: true },
        },
      },
    });
    res.status(200).json(lanches);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar lanches." });
  }
});

router.post("/completo", verificaToken, verificaAdmin, async (req, res) => {
  const valida = novoLancheCompletoSchema.safeParse(req.body);

  if (!valida.success) {
    res.status(400).json({ erro: valida.error.issues });
    return;
  }

  const dados = valida.data;
  const ingredientes = unificaIngredientes(dados.condimentos);

  if (dados.categoria === TipoItem.BEBIDA && ingredientes.length > 0) {
    res.status(400).json({ erro: "Bebidas não podem receber condimentos." });
    return;
  }

  try {
    // Chamada externa fica fora da transação, para não segurar a conexão do banco
    const estimativas = await estimaNutricoesFaltantes(
      ingredientes.map((i) => i.nome),
    );

    const lanche = await prisma.$transaction(async (tx) => {
      const tipoExistente = await tx.tipo.findFirst({
        where: { nome: { equals: dados.tipo, mode: "insensitive" } },
      });

      const tipo =
        tipoExistente ?? (await tx.tipo.create({ data: { nome: dados.tipo } }));

      const item = await tx.item.create({
        data: {
          nome: dados.nome,
          descricao: dados.descricao || null,
          preco: dados.preco,
          tipoId: tipo.id,
          categoria: dados.categoria,
          disponivel: true,
        },
      });

      await tx.foto.create({
        data: {
          itemId: item.id,
          url: dados.imagemUrl,
          descricao: dados.descricao || null,
        },
      });

      await vinculaIngredientes(tx, item.id, ingredientes, estimativas);

      return tx.item.findUnique({
        where: { id: item.id },
        include: {
          tipo: true,
          fotos: true,
          condimentos: { include: { condimento: true } },
        },
      });
    });

    res.status(201).json({
      mensagem: "Lanche adicionado com sucesso!",
      lanche,
      tabelaNutricional: lanche ? calculaTabela(lanche.condimentos) : null,
    });
  } catch (error) {
    console.error("ERRO AO CADASTRAR LANCHE COMPLETO:", error);
    res.status(500).json({ erro: "Erro ao cadastrar lanche." });
  }
});

router.post("/", verificaToken, verificaAdmin, async (req, res) => {
  const valida = itemSchema.safeParse(req.body);
  if (!valida.success) {
    res.status(400).json({ erro: valida.error });
    return;
  }

  try {
    const tipo = await prisma.tipo.findUnique({
      where: { id: valida.data.tipoId },
    });

    if (!tipo) {
      res.status(400).json({ erro: "O tipo informado não existe." });
      return;
    }

    const novoLanche = await prisma.item.create({
      data: {
        ...valida.data,
        disponivel: valida.data.disponivel ?? true,
        categoria: valida.data.categoria ?? TipoItem.LANCHE,
      },
    });
    res.status(201).json(novoLanche);
  } catch (error) {
    console.error("ERRO AO CADASTRAR ITEM:", error);
    res.status(500).json({ erro: "Erro ao cadastrar lanche." });
  }
});

router.patch("/:id", verificaToken, verificaAdmin, async (req, res) => {
  const { id } = req.params;
  const valida = itemSchema.partial().safeParse(req.body);
  if (!valida.success) {
    res.status(400).json({ erro: valida.error });
    return;
  }

  try {
    const lancheAtualizado = await prisma.item.update({
      where: { id: Number(id) },
      data: valida.data,
    });
    res.status(200).json(lancheAtualizado);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar lanche." });
  }
});

async function itemJaFoiPedido(itemId: number) {
  const total = await prisma.pedidoItem.count({ where: { itemId } });
  return total > 0;
}

async function excluirItemComVinculos(itemId: number) {
  return prisma.$transaction(async (tx) => {
    await tx.lancheCondimento.deleteMany({ where: { itemId } });
    await tx.foto.deleteMany({ where: { itemId } });
    return tx.item.delete({ where: { id: itemId } });
  });
}

router.delete("/:id", verificaToken, verificaAdmin, async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    res.status(400).json({ erro: "Id inválido." });
    return;
  }

  try {
    if (await itemJaFoiPedido(id)) {
      res.status(409).json({
        erro: "Este lanche já foi pedido e não pode ser excluído. Desative-o no cardápio.",
      });
      return;
    }

    const lancheDeletado = await excluirItemComVinculos(id);
    res.status(200).json(lancheDeletado);
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ erro: "Lanche não encontrado." });
      return;
    }
    console.error("ERRO AO DELETAR LANCHE:", error);
    res.status(500).json({ erro: "Erro ao deletar lanche." });
  }
});

router.get("/destaques", async (req, res) => {
  try {
    const lanches = await prisma.item.findMany({
      where: { destaque: true, disponivel: true },
      orderBy: { id: "desc" },
      include: {
        tipo: true,
        fotos: true,
        condimentos: { include: { condimento: true } },
      },
    });
    res.status(200).json(lanches);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar destaques." });
  }
});

router.get("/:id/tabela-nutricional", verificaToken, async (req, res) => {
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
        condimentos: { include: { condimento: true } },
      },
    })

    if (!lanche) {
      res.status(404).json({ erro: "Lanche não encontrado." })
      return
    }

    res.status(200).json({
      lanche: {
        id: lanche.id,
        nome: lanche.nome,
        descricao: lanche.descricao,
        tipo: lanche.tipo,
      },
      tabelaNutricional: calculaTabela(lanche.condimentos),
    })
  } catch (error) {
    console.error("ERRO AO CALCULAR TABELA NUTRICIONAL:", error)
    res.status(500).json({ erro: "Erro ao calcular tabela nutricional." })
  }
})

router.get("/:id/avaliacoes", async (req, res) => {
  const itemId = Number(req.params.id);

  if (!Number.isInteger(itemId)) {
    res.status(400).json({ erro: "Id inválido." });
    return;
  }

  try {
    const lanche = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true },
    });

    if (!lanche) {
      res.status(404).json({ erro: "Lanche não encontrado." });
      return;
    }

    const avaliacoes = await prisma.avaliacao.findMany({
      where: { itemId },
      orderBy: { criado: "desc" },
      select: {
        id: true,
        nota: true,
        comentario: true,
        criado: true,
        usuario: {
          select: {
            id: true,
            clientePerfil: { select: { nome: true } },
          },
        },
      },
    });

    const media = avaliacoes.length
      ? avaliacoes.reduce((total, avaliacao) => total + avaliacao.nota, 0) /
        avaliacoes.length
      : 0;

    res.status(200).json({
      media: Number(media.toFixed(1)),
      total: avaliacoes.length,
      avaliacoes,
    });
  } catch (error) {
    console.error("ERRO AO BUSCAR AVALIACOES:", error);
    res.status(500).json({ erro: "Erro ao buscar avaliações." });
  }
});

router.post(
  "/:id/avaliacoes",
  verificaToken,
  verificaCliente,
  async (req: any, res) => {
    const itemId = Number(req.params.id);
    const valida = avaliacaoSchema.safeParse(req.body);

    if (!Number.isInteger(itemId)) {
      res.status(400).json({ erro: "Id inválido." });
      return;
    }

    if (!valida.success) {
      res.status(400).json({ erro: valida.error.issues });
      return;
    }

    try {
      const lanche = await prisma.item.findUnique({
        where: { id: itemId },
        select: { id: true },
      });

      if (!lanche) {
        res.status(404).json({ erro: "Lanche não encontrado." });
        return;
      }

      const avaliacao = await prisma.avaliacao.create({
        data: {
          itemId,
          usuarioId: req.usuarioId,
          nota: valida.data.nota,
          comentario: valida.data.comentario || null,
        },
        select: {
          id: true,
          itemId: true,
          nota: true,
          comentario: true,
          criado: true,
        },
      });

      res.status(201).json(avaliacao);
    } catch (error: any) {
      if (error.code === "P2002") {
        res.status(409).json({ erro: "Você já avaliou este lanche." });
        return;
      }

      console.error("ERRO AO CRIAR AVALIACAO:", error);
      res.status(500).json({ erro: "Erro ao criar avaliação." });
    }
  },
);

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    res.status(400).json({ erro: "Id inválido." });
    return;
  }

  try {
    const lanche = await prisma.item.findUnique({
      where: { id },
      include: {
        tipo: true,
        fotos: true,
        condimentos: {
          include: { condimento: true },
        },
      },
    });

    if (!lanche) {
      res.status(404).json({ erro: "Lanche não encontrado." });
      return;
    }

    res.status(200).json(lanche);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar lanche." });
  }
});

router.get("/pesquisa/:termo", async (req, res) => {
  const { termo } = req.params;

  try {
    const lanches = await prisma.item.findMany({
      orderBy: { id: "desc" },
      include: {
        tipo: true,
        fotos: true,
        condimentos: { include: { condimento: true } },
      },
      where: {
        disponivel: true,
        OR: [
          { nome: { contains: termo, mode: "insensitive" } },
          { tipo: { nome: { contains: termo, mode: "insensitive" } } },
        ],
      },
    });
    res.status(200).json(lanches);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar lanches." });
  }
});

export default router;
