import express from 'express'
import connection from './db.js';  // Kết nối với database MySQL

import cors from "cors"
import cookieParser from 'cookie-parser';



import postRoute from './routes/post.route.js';
import authRoute from "./routes/auth.route.js"
import testRoute from "./routes/test.route.js"
import userRoute from "./routes/user.route.js"
import favoriteRoute from "./routes/favorite.route.js"
import vnpayRoute from "./routes/vnpay.route.js"
import walletRoute from "./routes/wallet.route.js"
import chatRoute from "./routes/chat.route.js"
import messageRoute from "./routes/message.route.js"


const app = express()


app.use(cors({
    origin: [
        process.env.CLIENT_URL, 
        process.env.BACKEND_URL   
    ],
    credentials: true
}));

app.use(express.json())
app.use(cookieParser())


// app.get("/api/post", postRoute)
app.use("/api/auth", authRoute)
app.use("/api/users", userRoute)
app.use("/api/test", testRoute)
app.use("/api/posts", postRoute)
app.use("/api/favorite", favoriteRoute)
app.use("/api/vnpay", vnpayRoute)
app.use('/api/wallet', walletRoute);
app.use('/api/chat', chatRoute);
app.use('/api/message', messageRoute);

app.listen(8800, () => {
    console.log("serve is running"); 
})