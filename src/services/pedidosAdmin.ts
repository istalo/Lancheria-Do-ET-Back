import { prisma } from '../../lib/prisma'
import { enviaEmailPedido, type DadosEmailPedido } from './emailPedidos'
import { StatusPedido } from '../../generated/prisma/enums'
import { emiteStatusPedido } from '../socket'

export type ResultadoAcaoPedido = { emailEnviado: boolean }

async function buscaPedidoParaEmail(id: number) {
  return prisma.pedido.findUnique({
    where: { id },
    include: {
      itens: { include: { item: { select: { nome: true } } } },
      clienteTabela: { select: { nome: true } },
      usuario: { select: { email: true } },
    },
  })
}

type PedidoParaEmail = NonNullable<Awaited<ReturnType<typeof buscaPedidoParaEmail>>>

function dadosParaEmail(pedido: PedidoParaEmail): DadosEmailPedido {
  return {
    email: pedido.usuario.email,
    nomeCliente: pedido.clienteTabela.nome,
    numeroPedido: pedido.id,
    itens: pedido.itens.map((i) => `${i.quantidade}x ${i.item.nome}`),
  }
}

async function marcaComoEntregue(id: number) {
  return prisma.pedido.update({
    where: { id },
    data: { entregue: true },
  })
}

// PedidoItem tem FK com RESTRICT, então os itens precisam sair antes do pedido
async function removePedidoComItens(id: number) {
  return prisma.$transaction([
    prisma.pedidoItem.deleteMany({ where: { pedidoId: id } }),
    prisma.pedido.delete({ where: { id } }),
  ])
}

export async function entregaPedido(id: number): Promise<ResultadoAcaoPedido | null> {
  const pedido = await buscaPedidoParaEmail(id)
  if (!pedido) return null

  await marcaComoEntregue(id)
  const emailEnviado = await enviaEmailPedido('ENTREGUE', dadosParaEmail(pedido))

  return { emailEnviado }
}

export async function recusaPedido(id: number): Promise<ResultadoAcaoPedido | null> {
  const pedido = await buscaPedidoParaEmail(id)
  if (!pedido) return null

  // Os dados do e-mail já foram lidos acima, antes de o pedido ser apagado
  await removePedidoComItens(id)
  const emailEnviado = await enviaEmailPedido('RECUSADO', dadosParaEmail(pedido))

  return { emailEnviado }
}

// Define as transições de status para os pedidos
const TRANSICOES: Record<StatusPedido, StatusPedido[]> = {
  RECEBIDO: ['EM_PREPARO', 'CANCELADO'],
  EM_PREPARO: ['SAIU_PARA_ENTREGA', 'CANCELADO'],
  SAIU_PARA_ENTREGA: ['ENTREGUE'],
  ENTREGUE: [],
  CANCELADO: [],
}

export async function atualizaStatusPedido(id: number, novo: StatusPedido) {
  const atual = await prisma.pedido.findUnique({ where: { id }, select: { status: true } })
  if (!atual) return null

  if (!TRANSICOES[atual.status].includes(novo)) {
    throw new Error('TRANSICAO_INVALIDA')
  }

  const pedido = await prisma.pedido.update({ where: { id }, data: { status: novo } })
  emiteStatusPedido(pedido)
  return pedido
}