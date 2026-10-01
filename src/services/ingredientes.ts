import { prisma } from '../../lib/prisma'
import type { Prisma } from '../../generated/prisma/client'
import { estimarNutricaoPor100g, type Nutricao100g } from '../routes/agente/gemini'
import { normalizaNome } from '../utils/normalizarNome'

export type IngredienteEntrada = { nome: string; quantidadeGramas: number }

// Normaliza os nomes e soma as gramas de ingredientes repetidos
export function unificaIngredientes(lista: IngredienteEntrada[]): IngredienteEntrada[] {
  const mapa = new Map<string, IngredienteEntrada>()

  for (const { nome, quantidadeGramas } of lista) {
    const chave = normalizaNome(nome)
    if (!chave) continue

    const atual = mapa.get(chave)
    mapa.set(chave, { nome: chave, quantidadeGramas: (atual?.quantidadeGramas ?? 0) + quantidadeGramas })
  }

  return [...mapa.values()]
}

// Devolve os nomes que não existem ainda ou existem sem valores nutricionais
async function nomesSemNutricao(nomes: string[]): Promise<string[]> {
  const existentes = await prisma.condimento.findMany({
    where: { nome: { in: nomes } },
    select: { nome: true, calorias100g: true },
  })

  const completos = new Set(
    existentes.filter((c) => c.calorias100g !== null).map((c) => c.nome),
  )

  return nomes.filter((nome) => !completos.has(nome))
}

// Chama o Gemini só para os ingredientes sem valores; falhas ficam de fora do mapa
export async function estimaNutricoesFaltantes(nomes: string[]): Promise<Map<string, Nutricao100g>> {
  const faltantes = await nomesSemNutricao(nomes)
  const resultados = await Promise.allSettled(
    faltantes.map((nome) => estimarNutricaoPor100g(nome)),
  )

  const estimativas = new Map<string, Nutricao100g>()

  resultados.forEach((resultado, i) => {
    if (resultado.status === 'fulfilled') {
      estimativas.set(faltantes[i], resultado.value)
    } else {
      console.error(`FALHA AO ESTIMAR "${faltantes[i]}":`, resultado.reason)
    }
  })

  return estimativas
}

async function garanteCondimento(
  tx: Prisma.TransactionClient,
  nome: string,
  nutricao?: Nutricao100g,
) {
  const dados = nutricao ?? {}

  return tx.condimento.upsert({
    where: { nome },
    update: dados,
    create: { nome, ...dados },
  })
}

export async function vinculaIngredientes(
  tx: Prisma.TransactionClient,
  itemId: number,
  ingredientes: IngredienteEntrada[],
  estimativas: Map<string, Nutricao100g>,
) {
  for (const { nome, quantidadeGramas } of ingredientes) {
    const condimento = await garanteCondimento(tx, nome, estimativas.get(nome))

    await tx.lancheCondimento.create({
      data: { itemId, condimentoId: condimento.id, quantidadeGramas },
    })
  }
}