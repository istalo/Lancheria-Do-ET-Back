import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

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

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any

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