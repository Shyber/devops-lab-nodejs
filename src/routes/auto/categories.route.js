import express from 'express'
import { listActiveCategories } from '../../data/cirsStore.js'

const router = express.Router()
router.get('/api/categories', (_req, res) => res.json(listActiveCategories()))
export default router
