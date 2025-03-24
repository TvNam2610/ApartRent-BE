import express from 'express'
import { createPaymentUrl, handleReturnUrl } from '../controllers/vnpay.js';
const router = express.Router()



router.post("/create_payment_url", createPaymentUrl );
router.get("/vnpay_return", handleReturnUrl);



export default router