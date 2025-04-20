import express from 'express';
import { logTransaction } from '../controllers/transaction.controller.js';
const router = express.Router()

router.post('/log', logTransaction);



export default router
