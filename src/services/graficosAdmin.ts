import { prisma } from '../../lib/prisma'

const DIAS_DO_GRAFICO = 7
const TAMANHO_DO_TOP = 5

type PontoGrafico = { x: string; y: number }

const ROTULOS_PAGAMENTO: Record<string, string> = {
  PIX: 'Pix',
  CARTAO_DEBITO: 'Débito',
  CARTAO_CREDITO: 'Crédito',
  DINHEIRO: 'Dinheiro',
}

// ---------- Datas ----------

function ultimosDias(quantidade: number): Date[] {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  return Array.from({ length: quantidade }, (_, i) => {
    const dia = new Date(hoje)
    dia.setDate(hoje.getDate() - (quantidade - 1 - i))
    return dia
  })
}

function chaveDoDia(data: Date): string {
  return `${data.getFullYear()}-${data.getMonth() + 1}-${data.getDate()}`
}

function rotuloDoDia(data: Date): string {
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

// ---------- Consultas ----------

async function buscaPedidosRecentes(dias: Date[]) {
  return prisma.pedido.findMany({
    where: { data: { gte: dias[0] } },
    select: {
      data: true,
      itens: { select: { quantidade: true, preco: true } },
    },
  })
}

type PedidoRecente = Awaited<ReturnType<typeof buscaPedidosRecentes>>[number]

async function nomesDosItens(ids: number[]): Promise<Map<number, string>> {
  const itens = await prisma.item.findMany({
    where: { id: { in: ids } },
    select: { id: true, nome: true },
  })

  return new Map(itens.map((item) => [item.id, item.nome]))
}

// ---------- Cálculos ----------

function totalDoPedido(pedido: PedidoRecente): number {
  return pedido.itens.reduce(
    (soma, item) => soma + item.quantidade * Number(item.preco),
    0,
  )
}

function somaPorDia(
  dias: Date[],
  pedidos: PedidoRecente[],
  valorDoPedido: (pedido: PedidoRecente) => number,
): PontoGrafico[] {
  const acumulado = new Map<string, number>()

  for (const pedido of pedidos) {
    const chave = chaveDoDia(pedido.data)
    acumulado.set(chave, (acumulado.get(chave) ?? 0) + valorDoPedido(pedido))
  }

  return dias.map((dia) => ({
    x: rotuloDoDia(dia),
    y: Math.round((acumulado.get(chaveDoDia(dia)) ?? 0) * 100) / 100,
  }))
}

// ---------- Gráficos ----------

async function pedidosPorPagamento(): Promise<PontoGrafico[]> {
  const grupos = await prisma.pedido.groupBy({
    by: ['pagamento'],
    _count: { _all: true },
  })

  return grupos.map((grupo) => ({
    x: ROTULOS_PAGAMENTO[grupo.pagamento] ?? grupo.pagamento,
    y: grupo._count._all,
  }))
}

async function lanchesMaisVendidos(): Promise<PontoGrafico[]> {
  const grupos = await prisma.pedidoItem.groupBy({
    by: ['itemId'],
    _sum: { quantidade: true },
    orderBy: { _sum: { quantidade: 'desc' } },
    take: TAMANHO_DO_TOP,
  })

  const nomes = await nomesDosItens(grupos.map((g) => g.itemId))

  return grupos.map((grupo) => ({
    x: nomes.get(grupo.itemId) ?? 'Removido',
    y: grupo._sum.quantidade ?? 0,
  }))
}

async function lanchesMelhorAvaliados(): Promise<PontoGrafico[]> {
  const grupos = await prisma.avaliacao.groupBy({
    by: ['itemId'],
    _avg: { nota: true },
    orderBy: { _avg: { nota: 'desc' } },
    take: TAMANHO_DO_TOP,
  })

  const nomes = await nomesDosItens(grupos.map((g) => g.itemId))

  return grupos.map((grupo) => ({
    x: nomes.get(grupo.itemId) ?? 'Removido',
    y: Math.round((grupo._avg.nota ?? 0) * 10) / 10,
  }))
}

export async function montaGraficosAdmin() {
  const dias = ultimosDias(DIAS_DO_GRAFICO)
  const pedidosRecentes = await buscaPedidosRecentes(dias)

  const [pagamentos, maisVendidos, melhorAvaliados] = await Promise.all([
    pedidosPorPagamento(),
    lanchesMaisVendidos(),
    lanchesMelhorAvaliados(),
  ])

  return {
    pedidosPorDia: somaPorDia(dias, pedidosRecentes, () => 1),
    faturamentoPorDia: somaPorDia(dias, pedidosRecentes, totalDoPedido),
    pagamentos,
    maisVendidos,
    melhorAvaliados,
  }
}