import express from 'express'
import { getSaved } from '../controllers/favorite.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';
const router = express.Router()

router.get('/get-favorite'  , getSaved);

export default router