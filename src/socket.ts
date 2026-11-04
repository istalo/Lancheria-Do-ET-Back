import { Server } from "socket.io"
import type { Server as app } from "http"
import jwt from "jsonwebtoken"

let io: Server

export function iniciaSocket(httpServer: app) {
    io = new Server(httpServer, { cors: { origin: '*' } })

    io.use((socket, next) => {
        try {
            const payload = jwt.verify(
                socket.handshake.auth?.token,
                process.env.JWT_SECRET as string,
            ) as any

            socket.data.usuarioId = payload.id
            socket.data.nivelAcesso = payload.nivelAcesso
            next()
        } catch {
            next(new Error('Token inválido'))
        }
    })

    io.on('connection', (socket) => {
        socket.join(`usuario:${socket.data.usuarioId}`)
        if (socket.data.nivelAcesso === 'ADMIN') socket.join('admin')
    })
}

export function emiteStatusPedido(p: { id: number; usuarioId: number; status: string }) {
    io.to(`usuario:${p.usuarioId}`).to('admin').emit('pedido:status', { id: p.id, status: p.status })
}

export function emiteNovoPedido(pedido: unknown) {
    io.to('admin').emit('pedido:novo', pedido)
}