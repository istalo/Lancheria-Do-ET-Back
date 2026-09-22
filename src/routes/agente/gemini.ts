import { GoogleGenAI } from '@google/genai'
import 'dotenv/config'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const schemaNutricional = {
  type: 'OBJECT',
  properties: {
    calorias: { type: 'NUMBER' },
    proteinas: { type: 'STRING' },
    carboidratos: { type: 'STRING' },
    gorduras: { type: 'STRING' },
    detalhes: { type: 'STRING' }
  },
  required: ['calorias', 'proteinas', 'carboidratos', 'gorduras', 'detalhes']
}

export async function estimarCaloriasComGemini(descricao: string) {
  const resposta = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: `
      Você é um nutricionista especialista em estimativa calórica. Analise os seguintes ingredientes de um lanche e estime o valor nutricional.
      Ingredientes: "${descricao}"

      Responda ESTRITAMENTE em formato JSON, sem nenhuma formatação markdown (como \`\`\`json) ou texto adicional antes ou depois. Use exatamente esta estrutura:
      {
        "calorias": número (apenas o valor total aproximado),
        "proteinas": "ex: 30g",
        "carboidratos": "ex: 45g",
        "gorduras": "ex: 15g",
        "detalhes": "Uma frase curta explicando que é uma estimativa aproximada baseada na descrição."
      }
    `,
    config: {
        responseMimeType: 'application/json',
        responseSchema: schemaNutricional,
    },
  })

  return JSON.parse(resposta.text || '{}')
}