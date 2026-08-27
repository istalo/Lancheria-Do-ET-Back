import express from 'express'
import cors from 'cors'

import routesMarcas from './routes/tipos'
import routesCarros from './routes/pedidos'

const app = express()
const port = 3000

app.use(express.json())
app.use(cors())

app.use("/marcas", routesMarcas)
app.use("/carros", routesCarros)

app.get('/', (req, res) => {
  res.send('API: Revenda de Veículos')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})