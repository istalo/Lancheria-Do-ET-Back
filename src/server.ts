import express from 'express'
import cors from 'cors'

//Import de Rotas
import adminRoutes from './routes/admin'
import loginRoutes from './routes/auth/login'
import lanchesRoutes from './routes/lanches'
import usuariosRoutes from './routes/usuarios'
import fotosRoutes from './routes/fotos'
import condimentosRoutes from './routes/condimentos'
import lanchesCondimentosRoutes from './routes/lanches_condimentos'
import pedidosRoutes from './routes/pedidos'
import clientesTabelaRoutes from './routes/clientesTabela'
import swaggerUi from 'swagger-ui-express'
import swaggerDocument from '../swagger-output.json'

const app = express()
const port = 3000

app.use(express.json())
app.use(cors())
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))

//Rotas do Sistema
app.use('/login', loginRoutes)
app.use('/admin', adminRoutes)
app.use('/usuarios', usuariosRoutes)
app.use('/lanches', lanchesRoutes)
app.use('/fotos', fotosRoutes)
app.use('/condimentos', condimentosRoutes)
app.use('/lanches-condimentos', lanchesCondimentosRoutes)
app.use('/pedidos', pedidosRoutes)
app.use('/clientes', clientesTabelaRoutes)

app.get('/', (req, res) => {
  res.send('API: Lancheria do ET')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})