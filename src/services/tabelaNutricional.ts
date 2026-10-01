type LinhaIngrediente = {
  quantidadeGramas: number | null
  condimento: {
    nome: string
    calorias100g: unknown
    proteinas100g: unknown
    carboidratos100g: unknown
    gorduras100g: unknown
  }
}

const arredonda = (valor: number) => Math.round(valor * 10) / 10

export function calculaTabela(linhas: LinhaIngrediente[]) {
  const total = { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
  const incompletos: string[] = []
  let pesoTotalGramas = 0

  for (const { quantidadeGramas, condimento: c } of linhas) {
    if (quantidadeGramas === null || c.calorias100g === null) {
      incompletos.push(c.nome)
      continue
    }

    const fator = quantidadeGramas / 100
    pesoTotalGramas += quantidadeGramas
    total.calorias += Number(c.calorias100g) * fator
    total.proteinas += Number(c.proteinas100g) * fator
    total.carboidratos += Number(c.carboidratos100g) * fator
    total.gorduras += Number(c.gorduras100g) * fator
  }

  return {
    calorias: arredonda(total.calorias),
    proteinas: arredonda(total.proteinas),
    carboidratos: arredonda(total.carboidratos),
    gorduras: arredonda(total.gorduras),
    pesoTotalGramas,
    completa: incompletos.length === 0 && linhas.length > 0,
    ingredientesIncompletos: incompletos,
  }
}