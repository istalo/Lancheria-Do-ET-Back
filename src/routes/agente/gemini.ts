import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import 'dotenv/config'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const nutricaoSchema = z.object({
  calorias100g: z.number().nonnegative(),
  proteinas100g: z.number().nonnegative(),
  carboidratos100g: z.number().nonnegative(),
  gorduras100g: z.number().nonnegative(),
})

export type Nutricao100g = z.infer<typeof nutricaoSchema>

const schemaGemini = {
  type: 'OBJECT',
  properties: {
    calorias100g: { type: 'NUMBER' },
    proteinas100g: { type: 'NUMBER' },
    carboidratos100g: { type: 'NUMBER' },
    gorduras100g: { type: 'NUMBER' },
  },
  required: ['calorias100g', 'proteinas100g', 'carboidratos100g', 'gorduras100g'],
}

export async function estimarNutricaoPor100g(ingrediente: string): Promise<Nutricao100g> {
  const resposta = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: `
      Você é um nutricionista. Estime o valor nutricional de 100 g do ingrediente "${ingrediente}",
      considerando o preparo usual em lanches (ex.: carne já grelhada, pão pronto).
      Responda apenas em JSON: calorias100g (kcal), proteinas100g, carboidratos100g e gorduras100g (em gramas).
    `,
    config: {
      responseMimeType: 'application/json',
      responseSchema: schemaGemini,
    },
  })

  return nutricaoSchema.parse(JSON.parse(resposta.text || '{}'))
}