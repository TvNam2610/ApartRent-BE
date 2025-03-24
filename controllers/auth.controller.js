import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import prisma from "../lib/prisma.js";


export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo người dùng mới và lưu vào DB
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: "USER", // Đảm bảo bạn có trường "role" trong schema Prisma của bạn
      },
    });

    // Tạo ví cho người dùng mới
    const wallet = await prisma.wallet.create({
      data: {
        userId: newUser.id, // Liên kết ví với user ID
      },
    });

    console.log(newUser);
    console.log(wallet); // Kiểm tra thông tin ví đã tạo

    res.status(201).json({
      message: "User and wallet created successfully",
      user: newUser,
      wallet: wallet,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create user and wallet!" });
  }
};


export const login = async (req, res) => {
  console.log("Request Body: ", req.body);
  const { email, password } = req.body;

  // Kiểm tra nếu thiếu email hoặc password
  if (!email || !password) {
    return res.status(400).json({ message: "Vui lòng cung cấp email và mật khẩu." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) return res.status(400).json({ message: "Thông tin đăng nhập không hợp lệ!" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(400).json({ message: "Thông tin đăng nhập không hợp lệ!" });

    const age = 1000 * 60 * 60 * 24 * 7;
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        isAdmin: user.role === "ADMIN",
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: age }
    );

    const { password: userPassword, ...userInfo } = user;
    res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: age,
      })
      .status(200)
      .json(userInfo);
  } catch (err) {
    console.error("Login error: ", err);
    res.status(500).json({ message: "Failed to login!" });
  }
}


export const logout  = (req,res) => {
  res.clearCookie("token").status(200).json({ message: "Logout Successful" });
}