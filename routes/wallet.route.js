import express from 'express';
import {  getWallet,deductBalance,depositToWallet,handleCallback, updateWallet } from '../controllers/wallet.controller.js';
import {verifyToken} from "../middleware/verifyToken.js"
const router = express.Router()


// Route để nạp tiền vào ví
router.post('/deposit', depositToWallet);

// Route xử lý callback từ PayOS
router.post('/callback', handleCallback);

// Route để lấy thông tin ví
router.get('/',getWallet);
router.post('/deduct', deductBalance);

router.post('/updateWallet',updateWallet);

export default router
