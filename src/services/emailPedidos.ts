import 'dotenv/config'
import nodemailer from 'nodemailer'

export type StatusEmail = 'ENTREGUE' | 'RECUSADO'

export type DadosEmailPedido = {
  email: string
  nomeCliente: string
  numeroPedido: number
  itens: string[]
}

const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAILTRAP_EMAIL,
    pass: process.env.MAILTRAP_SENHA,
  },
})

function escapaHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function assuntoDoEmail(status: StatusEmail, numeroPedido: number): string {
  return status === 'ENTREGUE'
    ? `Seu pedido #${numeroPedido} foi enviado!`
    : `Seu pedido #${numeroPedido} foi recusado`
}

function mensagemPrincipal(status: StatusEmail): string {
  return status === 'ENTREGUE'
    ? 'Boa notícia! Seu pedido foi enviado e já está a caminho.'
    : 'Infelizmente não conseguimos atender o seu pedido desta vez e ele foi recusado.'
}

function corpoEmTexto(status: StatusEmail, dados: DadosEmailPedido): string {
  return [
    `Olá, ${dados.nomeCliente}!`,
    mensagemPrincipal(status),
    `Itens do pedido #${dados.numeroPedido}:`,
    ...dados.itens.map((item) => `- ${item}`),
    'Lancheria do ET',
  ].join('\n')
}

function corpoEmHtml(status: StatusEmail, dados: DadosEmailPedido): string {
  const itens = dados.itens.map((item) => `<li>${escapaHtml(item)}</li>`).join('')

  return `
    <h3>Olá, ${escapaHtml(dados.nomeCliente)}!</h3>
    <p>${mensagemPrincipal(status)}</p>
    <p><b>Itens do pedido #${dados.numeroPedido}:</b></p>
    <ul>${itens}</ul>
    <p>Lancheria do ET</p>`
}

// Devolve true/false em vez de lançar erro: falha de e-mail não deve desfazer a ação do admin
export async function enviaEmailPedido(
  status: StatusEmail,
  dados: DadosEmailPedido,
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: '"Lancheria do ET" <suporte@etlanches.com>',
      to: dados.email,
      subject: assuntoDoEmail(status, dados.numeroPedido),
      text: corpoEmTexto(status, dados),
      html: corpoEmHtml(status, dados),
    })
    return true
  } catch (error) {
    console.error('ERRO AO ENVIAR E-MAIL DO PEDIDO:', error)
    return false
  }
}