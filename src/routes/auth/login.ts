import { prisma } from '../../../lib/prisma'
import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const router = Router()

router.post("/", async (req, res) => {
  const { email, senha } = req.body

  if (!email || !senha) {
    res.status(400).json({ erro: "E-mail e senha obrigatórios" })
    return
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    })

    if (!usuario) {
      res.status(400).json({ erro: "E-mail ou senha incorretos" })
      return
    }

    const senhaCorreta = bcrypt.compareSync(senha, usuario.senha)

    if (!senhaCorreta) {
      res.status(400).json({ erro: "E-mail ou senha incorretos" })
      return
    }

      const token = jwt.sign(
        { id: usuario.id, 
        email: usuario.email, 
        nivelAcesso: usuario.nivelAcesso 
    },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' }
      )

    res.status(200).json({ 
        mensagem: "Login bem-sucedido", 
        token: token
        })

    } catch (error) {
        res.status(500).json({ erro: "Erro no servidor" })
    }
    })

export default router