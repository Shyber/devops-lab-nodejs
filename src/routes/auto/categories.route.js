import express from 'express'
import { store } from '../../data/cirsStore.js'

const router = express.Router()
router.get('/api/categories', (_req, res) => res.json(store.categories.filter(item => item.active)))
export default router
