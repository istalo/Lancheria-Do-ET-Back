import { prisma } from '../../lib/prisma'
import { StatusPedido } from '../../generated/prisma/enums'
import { emiteStatusPedido } from '../socket'

const TRANSICOES: Record<StatusPedido, StatusPedido[]> = {
  RECEBIDO: ['EM_PREPARO', 'CANCELADO'],
  EM_PREPARO: ['PRONTO', 'CANCELADO'],
  PRONTO: ['SAIU_PARA_ENTREGA', 'CANCELADO'],
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