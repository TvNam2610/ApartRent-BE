import express from 'express'
import connection from './database/database.js';  // Kết nối với database MySQL

import cors from "cors"
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();


import upload from './middleware/multer.js';
import adminRoute from './routes/admin/dashboard.route.js'
import postAdminRoute from './routes/admin/post.route.js'
import postRoute from './routes/post.route.js';
import authRoute from "./routes/auth.route.js"
import packageRoute from './routes/package.route.js'
// import testRoute from "./routes/test.route.js"
// import userRoute from "./routes/user.route.js"
// import favoriteRoute from "./routes/favorite.route.js"
// import vnpayRoute from "./routes/vnpay.route.js"
import walletRoute from "./routes/wallet.route.js"
import transactionRoute from "./routes/transaction.route.js"
// import chatRoute from "./routes/chat.route.js"
// import messageRoute from "./routes/message.route.js"


// Dùng import.meta.url để lấy đường dẫn hiện tại
import { fileURLToPath } from 'url';

// Lấy đường dẫn thư mục hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express()

//Sử dụng thư mục chứa tài nguyên tĩnh (CSS, JS, ảnh):
app.use(express.static(path.join(__dirname, 'public')));

// Cấu hình EJS làm template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));  // Đặt thư mục views


app.use(cors({
    origin: [
        process.env.CLIENT_URL, 
        process.env.BACKEND_URL   
    ],
    credentials: true
}));

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())


// app.get("/api/post", postRoute)
app.use("/api/auth", authRoute)
// app.use("/api/users", userRoute)
// app.use("/api/test", testRoute)
app.use("/api/posts", postRoute)
app.use("/api/package", packageRoute)
// app.use("/api/favorite", favoriteRoute)
// app.use("/api/vnpay", vnpayRoute)
app.use('/api/wallet', walletRoute);
app.use('/api/transaction', transactionRoute);
// app.use('/api/chat', chatRoute);
// app.use('/api/message', messageRoute);



/// router cho admin
app.use('/admin', adminRoute)
app.use('/admin/post', postAdminRoute)


app.listen(8800, () => {
    console.log("serve is running"); 
})