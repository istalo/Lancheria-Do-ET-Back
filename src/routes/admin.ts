import { prisma } from '../../lib/prisma'
import { Router } from 'express'
import { verificaToken, verificaAdmin } from '../middlewares/verificaToken'

const router = Router()

router.use(verificaToken, verificaAdmin)

router.get("/dashboard", async (req, res) => {
    try {
        const totalPedidos = await prisma.pedido.count()
        const lanchesAtivos = await prisma.item.count({ where: { disponivel: true } })
        const totalClientes = await prisma.clienteTabela.count()

        res.status(200).json({
            resumo: {
                pedidosRealizados: totalPedidos,
                lanchesNoCardapio: lanchesAtivos,
                clientesRegistrados: totalClientes
            }
        })
    } catch (error) {
        res.status(500).json({ erro: "Erro ao carregar os dados do dashboard." })
    }
})

router.get("/pedidos", async (req, res) => {
    try {
        const pedidos = await prisma.pedido.findMany({
            orderBy: { data: 'desc' },
            include: {
                itens: { include: { item: true } },
                clienteTabela: true,
                usuario: {
                    select: { email: true }
                }
            }
        })
        res.status(200).json(pedidos)
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar a fila de pedidos." })
    }
})

router.get("/clientes", async (req, res) => {
    try {
        const clientes = await prisma.clienteTabela.findMany({
            include: {
                usuario: {
                    select: { email: true, nivelAcesso: true }
                }
            }
        })
        res.status(200).json(clientes)
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar a lista de clientes." })
    }
})

export default router