import querystring from 'querystring';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const config = {
    vnp_TmnCode: process.env.VNP_TMNCODE, // Mã website từ VNPay
    vnp_HashSecret: process.env.VNP_HASHSECRET, // Chuỗi bí mật
    vnp_Url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', // Sandbox URL
    vnp_ReturnUrl: process.env.VNP_RETURNURL, // URL trả về sau thanh toán
};

// Hàm tạo URL thanh toán
export const createPaymentUrl = (req, res) => {
    try {
        const { amount, orderInfo } = req.body;

        // Kiểm tra đầu vào
        if (!amount || amount <= 0 || !orderInfo) {
            return res.status(400).json({ message: 'Invalid amount or orderInfo' });
        }

        const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const date = new Date();
        const createDate = date.toISOString().slice(0, 19).replace('T', '').replace(/-/g, '').replace(/:/g, '');
        const orderId = `${date.getTime()}`; // Mã giao dịch duy nhất

        // Chuẩn bị tham số
        const vnpParams = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: config.vnp_TmnCode,
            vnp_Locale: 'vn',
            vnp_CurrCode: 'VND',
            vnp_TxnRef: `${orderId}`, // Mã giao dịch (chuỗi)
            vnp_OrderInfo: `${orderInfo}`, // Mô tả giao dịch (chuỗi)
            vnp_OrderType: 'billpayment',
            vnp_Amount: `${amount * 100}`, // Đơn vị VNĐ (chuỗi số nguyên)
            vnp_ReturnUrl: config.vnp_ReturnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate,
        };
        console.log('vnpParams:', vnpParams);
        // Chuyển tất cả giá trị về dạng chuỗi để tránh `[object Object]`
        Object.keys(vnpParams).forEach((key) => {
            vnpParams[key] = `${vnpParams[key]}`; // Ép thành chuỗi
        });

        // Tạo chữ ký (hash)
        const secureHash = crypto
            .createHmac('sha512', config.vnp_HashSecret)
            .update(querystring.stringify(vnpParams, { encode: false }))
            .digest('hex');

        vnpParams.vnp_SecureHash = secureHash;

        // Tạo URL thanh toán
        const paymentUrl = `${config.vnp_Url}?${querystring.stringify(vnpParams, { encode: false })}`;
        return res.status(200).json({ paymentUrl });
    } catch (error) {
        console.error('Error in createPaymentUrl:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Hàm xử lý kết quả thanh toán
export const handleReturnUrl = (req, res) => {
    try {
        const query = req.query;
        const secureHash = query.vnp_SecureHash;
        delete query.vnp_SecureHash;

        // Tạo hash để xác thực
        const hash = crypto
            .createHmac('sha512', config.vnp_HashSecret)
            .update(querystring.stringify(query, { encode: false }))
            .digest('hex');

        if (hash === secureHash) {
            return res.status(200).json({
                status: query.vnp_ResponseCode,
                message: 'Payment verified successfully!',
            });
        } else {
            return res.status(400).json({ message: 'Invalid checksum' });
        }
    } catch (error) {
        console.error('Error in handleReturnUrl:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
