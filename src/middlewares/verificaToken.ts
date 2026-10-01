import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma'

export interface TokenInterface extends Request {
  usuarioId?: number
  nivelAcesso?: string
}

export function verificaToken(req: TokenInterface, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    res.status(401).json({ erro: "Acesso negado. Token não fornecido." })
    return
  }

  const [scheme, token] = authHeader.split(' ')

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ erro: "Autorização deve usar o Bearer token." })
    return
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any

    if (typeof payload !== 'object' || typeof payload.id !== 'number' ||
      (payload.nivelAcesso !== 'CLIENTE' && payload.nivelAcesso !== 'ADMIN')) {
      res.status(403).json({ erro: "Token inválido." })
      return
    }

    req.usuarioId = payload.id
    req.nivelAcesso = payload.nivelAcesso

    next()
  } catch (error) {
    res.status(403).json({ erro: "Token inválido ou expirado." })
  }
}

export function verificaAdmin(req: TokenInterface, res: Response, next: NextFunction) {
  if (req.nivelAcesso !== "ADMIN") {
    res.status(403).json({ erro: "Permissão negada." })
    return
  }
  next()
}

export async function verificaCliente(req: TokenInterface, res: Response, next: NextFunction) {
  if (req.nivelAcesso !== 'CLIENTE' || !req.usuarioId) {
    res.status(403).json({ erro: 'Apenas clientes podem avaliar lanches.' })
    return
  }

  try {
    const cliente = await prisma.clienteTabela.findUnique({
      where: { usuarioId: req.usuarioId },
      select: { id: true },
    })

    if (!cliente) {
      res.status(403).json({ erro: 'Cadastre seu perfil de cliente antes de avaliar.' })
      return
    }

    next()
  } catch (error) {
    console.error('ERRO AO VALIDAR CLIENTE:', error)
    res.status(500).json({ erro: 'Erro ao validar cliente.' })
  }
}