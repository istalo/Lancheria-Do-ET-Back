import { Router } from 'express'
import { verificaAdmin } from './verificaToken'

const router = Router()

router.use(verificaAdmin)

export default router