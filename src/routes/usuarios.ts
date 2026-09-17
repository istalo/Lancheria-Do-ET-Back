import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import { z } from 'zod'
import { verificaToken, verificaAdmin } from "./verificaToken" 
import bcrypt from 'bcrypt'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

const router = Router()

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAILTRAP_EMAIL,
    pass: process.env.MAILTRAP_SENHA
  },
})

const usuarioSchema = z.object({
  nome: z.string().min(3,
    { message: "Nome deve possuir, no mínimo, 3 caracteres" }),
  email: z.email().min(10,
    { message: "E-mail, no mínimo, 10 caracteres" }),
  senha: z.string().min(8,
    { message: "Senha deve possuir, no mínimo, 8 caracteres" }),
})

router.get("/", verificaToken, verificaAdmin, async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany()
    res.status(200).json(usuarios)
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar usuários" })
  }
})

function validaSenha(senha: string) {

  const mensa: string[] = []

  if (senha.length < 8) {
    mensa.push("Erro... senha deve possuir, no mínimo, 8 caracteres")
  }


  let pequenas = 0
  let grandes = 0
  let numeros = 0
  let simbolos = 0


  for (const letra of senha) {
    if ((/[a-z]/).test(letra)) {
      pequenas++
    }
    else if ((/[A-Z]/).test(letra)) {
      grandes++
    }
    else if ((/[0-9]/).test(letra)) {
      numeros++
    } else {
      simbolos++
    }
  }

  if (pequenas == 0) {
    mensa.push("Erro... senha deve possuir letra(s) minúscula(s)")
  }

  if (grandes == 0) {
    mensa.push("Erro... senha deve possuir letra(s) maiúscula(s)")
  }

  if (numeros == 0) {
    mensa.push("Erro... senha deve possuir número(s)")
  }

  if (simbolos == 0) {
    mensa.push("Erro... senha deve possuir símbolo(s)")
  }

  return mensa
}

router.post("/", async (req, res) => {

  const valida = usuarioSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, email, senha } = valida.data

  const mensaErros = validaSenha(senha)

  if (mensaErros.length > 0) {
    res.status(400).json({erro: mensaErros})
    return
  }

  const salt = bcrypt.genSaltSync(12)

  const hash = bcrypt.hashSync(senha, salt)  

  try {
    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: hash }
    })

    const tokenAtivacao = crypto.randomBytes(32).toString('hex')
    const validadeToken = new Date()
    validadeToken.setHours(validadeToken.getHours() + 24)

    await prisma.token.create({
    data: {
      usuarioId: usuario.id,
      token: tokenAtivacao,
      tipoToken: "VALIDACAO_EMAIL",
      expira: validadeToken
    }
  })

  const linkAtivacao = `http://localhost:5173/ativar-conta?token=${tokenAtivacao}`

    transporter.sendMail({
        from: '"Dexter App" <support@dexterapp.com>',
        to: email,
        subject: "Ative sua conta no Dexter App",
        text: `Bem-vindo! Clique no link para ativar sua conta: ${linkAtivacao}`,
        html: `<h3>Bem-vindo ao Dexter!</h3>
            <p>Para começar a usar o aplicativo, ative sua conta clicando no link abaixo:</p>
            <a href="${linkAtivacao}">Ativar Minha Conta</a>
            <p>Este link expira em 24 horas.</p>`
    }).catch(err => console.error("Erro ao enviar email de ativação:", err))

    res.status(201).json({ mensagem: "Verifique seu e-mail para ativar sua conta." })
  } 
catch (error) {
    res.status(400).json({ erro: "Erro ao criar usuário" })
  }
})

router.post("/ativar", async (req, res) => {
  const { token } = req.body

  if (!token) {
    res.status(400).json({ erro: "Token de ativação não fornecido." })
    return
  }

  try {
    const tokenValido = await prisma.token.findFirst({
      where: {
        token: token,
        tipoToken: "VALIDACAO_EMAIL",
        revogado: false,
        expira: { gt: new Date() },
      }
    })

    if (!tokenValido) {
      res.status(400).json({ erro: "Link de ativação inválido ou expirado" })
      return
    }

    await prisma.usuario.update({
      where: { id: tokenValido.usuarioId },
      data: { statusConta: "ATIVA" }
    })

    await prisma.token.update({
      where: { id: tokenValido.id },
      data: { revogado: true }
    })

    res.status(200).json({ mensagem: "Conta ativada com sucesso! Você já pode fazer login." })
  } catch (error) {
    console.error("ERRO NA ATIVAÇÃO DA CONTA:", error)
    res.status(500).json({ erro: "Erro ao ativar a conta." })
  }
})

router.delete("/:id", verificaToken, verificaAdmin, async (req, res) => {
  const { id } = req.params

  try {
    const usuario = await prisma.usuario.delete({
      where: { id: String(id) }
    })
    res.status(200).json(usuario)
  } catch (error) {
    res.status(400).json({ erro: "Erro no servidor" })
  }
})

router.post("/esqueceu-senha", async (req, res) => {
  const { email } = req.body

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } })
    
    if (!usuario) {
      res.status(400).json({ erro: "E-mail não encontrado na base de dados" })
      return
    }

    const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let codigo = ""
    for (let i = 0; i < 4; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length))
    }

    const validadeToken = new Date()
    validadeToken.setMinutes(validadeToken.getMinutes() + 15)

await prisma.token.create({
      data: {
        usuarioId: usuario.id,
        token: codigo,
        tipoToken: "REDEFINIR_SENHA",
        expira: validadeToken
      }
    })

    transporter.sendMail({
      from: '"Dexter App" <support@dexterapp.com>',
      to: email,
      subject: "Código de Recuperação de Senha",
      text: `Seu código de recuperação é: ${codigo}`,
      html: `<h3>Recuperação de Senha</h3><p>Seu código de recuperação é: <b>${codigo}</b></p>`
    }).catch(err => console.error("Erro ao enviar email:", err))

    res.status(200).json({ mensagem: "Um código de recuperação foi enviado para o seu e-mail" })

  } catch (error) {
    console.error("Erro na validação do esqueceu senha:", error)
    res.status(500).json({ erro: "Erro no servidor" })
  }
})

router.post("/recupera-senha", async (req, res) => {
  const { email, codigo, novaSenha } = req.body

  if (!email || !codigo || !novaSenha) {
    res.status(400).json({ erro: "Por favor, informe o e-mail, o código e a nova senha" })
    return
  }

  const mensaErros = validaSenha(novaSenha)
  if (mensaErros.length > 0) {
    res.status(400).json({ erro: mensaErros })
    return
  }

  try {
    const tokenValido = await prisma.token.findFirst({
        where: {
            token: codigo.trim().toUpperCase(),
            tipoToken: "REDEFINIR_SENHA",
            revogado: false,
            expira: {gt: new Date()},
            usuario: { email: email }
        }
    })

    if (!tokenValido) {
      res.status(400).json({ erro: "Código de recuperação inválido ou expirado" })
      return
    }

    const salt = bcrypt.genSaltSync(12)
    const hash = bcrypt.hashSync(novaSenha, salt)

    await prisma.usuario.update({
      where: { email },
      data: { senha: hash }
    })

    await prisma.token.update({
      where: { id: tokenValido.id },
      data: { revogado: true }
    })

    res.status(200).json({ mensagem: "Senha alterada com sucesso! Você já pode fazer login." })

  } catch (error) {
    res.status(500).json({ erro: "Erro ao redefinir senha" })
  }
})

export default router