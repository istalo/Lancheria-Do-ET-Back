import { prisma } from "../../lib/prisma";
import { Router } from 'express';
import { verificaToken, verificaAdmin } from './verificaToken';

const router = Router();

router.get("/", async (req, res) => {
  try {
    const lanches = await prisma.lanche.findMany({
      include: {
        tipo: true,
        fotos: true,
        condimentos: {
          include: { condimento: true }
        }
      }
    });
    res.status(200).json(lanches);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar lanches." });
  }
});

router.post("/", verificaToken, verificaAdmin, async (req, res) => {
  const { nome, descricao, tipoId, preco, quantidade } = req.body;

  try {
    const novoLanche = await prisma.lanche.create({
      data: {
        nome,
        descricao,
        tipoId,
        preco,
        quantidade
      }
    });
    res.status(201).json(novoLanche);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao cadastrar lanche." });
  }
});

export default router;