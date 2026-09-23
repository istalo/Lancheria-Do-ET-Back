import express from 'express'
import cors from 'cors'

// Import de Rotas
import adminRoutes from './routes/admin'
import loginRoutes from './routes/auth/login'
import lanchesRoutes from './routes/lanches'
import usuariosRoutes from './routes/usuarios'
import fotosRoutes from './routes/fotos'
import condimentosRoutes from './routes/condimentos'
import lanchesCondimentosRoutes from './routes/lanches_condimentos'
import pedidosRoutes from './routes/pedidos'
import clientesTabelaRoutes from './routes/clientesTabela'
import tiposRoutes from './routes/tipos'

// Gemini
import { estimarCaloriasComGemini } from './routes/agente/gemini'

// Middleware
import { verificaToken } from './middlewares/verificaToken'

// Swagger
import swaggerUi from 'swagger-ui-express'
import swaggerDocument from '../swagger-output.json'

const app = express()
const port = 3000

app.use(express.json())
app.use(cors())
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Rotas do Sistema
app.use('/login', loginRoutes)
app.use('/admin', adminRoutes)
app.use('/usuarios', usuariosRoutes)
app.use('/lanches', lanchesRoutes)
app.use('/fotos', fotosRoutes)
app.use('/condimentos', condimentosRoutes)
app.use('/lanches-condimentos', lanchesCondimentosRoutes)
app.use('/pedidos', pedidosRoutes)
app.use('/clientes', clientesTabelaRoutes)
app.use('/tipos', tiposRoutes)

// Rota do Gemini para estimar calorias
app.post('/calorias', verificaToken, async (req, res) => {
  const { descricao } = req.body

  if (!descricao) {
    return res.status(400).json({ erro: "A descrição do lanche é obrigatória para calcular as calorias." })
  }

  try {
    const calorias = await estimarCaloriasComGemini(descricao)
    res.json(calorias)
  } catch (error) {
    console.error("Erro ao estimar calorias:", error)
    res.status(500).json({ erro: "Erro ao estimar calorias." })
  }
})

app.get('/', (req, res) => {
  res.send('API: Lancheria do ET')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})