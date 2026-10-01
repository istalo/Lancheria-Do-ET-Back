import { prisma } from '../../lib/prisma'
import { Router } from 'express'
import { verificaToken, verificaAdmin } from '../middlewares/verificaToken'
import { montaGraficosAdmin } from '../services/graficosAdmin'
import { entregaPedido, recusaPedido } from '../services/pedidosAdmin'

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

router.get("/graficos", async (req, res) => {
    try {
        res.status(200).json(await montaGraficosAdmin())
    } catch (error) {
        console.error("ERRO AO MONTAR GRÁFICOS:", error)
        res.status(500).json({ erro: "Erro ao carregar os gráficos." })
    }
})

router.patch("/pedidos/:id/entregar", async (req, res) => {
    const id = Number(req.params.id)

    if (!Number.isInteger(id)) {
        res.status(400).json({ erro: "Id inválido." })
        return
    }

    try {
        const resultado = await entregaPedido(id)

        if (!resultado) {
            res.status(404).json({ erro: "Pedido não encontrado." })
            return
        }

        res.status(200).json(resultado)
    } catch (error) {
        console.error("ERRO AO MARCAR PEDIDO COMO ENTREGUE:", error)
        res.status(500).json({ erro: "Erro ao marcar o pedido como entregue." })
    }
})

router.delete("/pedidos/:id/recusar", async (req, res) => {
    const id = Number(req.params.id)

    if (!Number.isInteger(id)) {
        res.status(400).json({ erro: "Id inválido." })
        return
    }

    try {
        const resultado = await recusaPedido(id)

        if (!resultado) {
            res.status(404).json({ erro: "Pedido não encontrado." })
            return
        }

        res.status(200).json(resultado)
    } catch (error) {
        console.error("ERRO AO RECUSAR PEDIDO:", error)
        res.status(500).json({ erro: "Erro ao recusar o pedido." })
    }
})

export default router