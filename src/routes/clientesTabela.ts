import { prisma } from '../../lib/prisma'
import { Router } from 'express'
import { verificaToken, verificaAdmin } from '../middlewares/verificaToken'

const router = Router()

router.get("/", verificaToken, verificaAdmin, async (req: any, res) => {
    try {
        const clientes = await prisma.clienteTabela.findMany({
            include: {
                usuario: {
                    select: {
                        email: true
                    }
                }
            }
        })
        res.status(200).json(clientes)
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar clientes." })
    }
})

router.get("/eu", verificaToken, async (req: any, res) => {
    const usuarioId = req.usuarioId

    try {
        const perfil = await prisma.clienteTabela.findUnique({
            where: { usuarioId: Number(usuarioId) }
        })

        if (!perfil) {
            return res.status(404).json({ erro: "Perfil de cliente não encontrado." })
        }

        res.status(200).json(perfil)
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar perfil." })
    }
})

router.post("/", verificaToken, async (req: any, res) => {
    const { nome, endereco, telefone } = req.body
    const usuarioId = req.usuarioId

    try {
        const perfilExistente = await prisma.clienteTabela.findUnique({
            where: { usuarioId: Number(usuarioId) }
        })

        if (perfilExistente) {
            return res.status(400).json({ erro: "Este usuário já possui um perfil cadastrado." })
        }

        const novoPerfil = await prisma.clienteTabela.create({
            data: {
                usuarioId: Number(usuarioId),
                nome,
                endereco,
                telefone
            }
        })

        res.status(201).json(novoPerfil)
    } catch (error) {
        res.status(500).json({ erro: "Erro ao cadastrar perfil." })
    }
})

router.patch("/", verificaToken, async (req: any, res) => {
    const { nome, endereco, telefone } = req.body
    const usuarioId = req.usuarioId

    try {
        const perfilAtualizado = await prisma.clienteTabela.update({
            where: { usuarioId: Number(usuarioId) },
            data: {
                nome,
                endereco,
                telefone
            }
        })

        res.status(200).json(perfilAtualizado)
    } catch (error) {
        res.status(500).json({ erro: "Erro ao atualizar perfil." })
    }
})

export default router