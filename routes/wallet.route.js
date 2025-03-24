import express from 'express';
import { depositToWallet, getWallet, handleCallback,updateWallet } from '../controllers/wallet.controller.js';
const router = express.Router()


// Route để nạp tiền vào ví
router.post('/deposit', depositToWallet);

// Route xử lý callback từ PayOS
router.post('/callback', handleCallback);

// Route để lấy thông tin ví
router.get('/:userId',getWallet);
router.post('/updateWallet',getWallet);

export default router
