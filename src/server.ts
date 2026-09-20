import express from 'express'
import cors from 'cors'
import adminRoutes from './routes/admin'
import lanchesRoutes from './routes/lanches'
import swaggerUi from 'swagger-ui-express'
import swaggerDocument from '../swagger-output.json'

const app = express()
const port = 3000

app.use(express.json())
app.use(cors())
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use('/admin', adminRoutes); 
app.use('/lanches', lanchesRoutes);

app.get('/', (req, res) => {
  res.send('API: Revenda de Veículos')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})