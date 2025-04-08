import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Database from "../database/database.js"; // Import Database class đã tạo
const db = new Database(); // Khởi tạo lớp Database
// import UserModel from "../model/user.model.js";
// Đăng ký người dùng mới
export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Kiểm tra xem email đã tồn tại trong cơ sở dữ liệu chưa
    const checkUserQuery = "SELECT * FROM user WHERE email = ?";
    const { rs, data: existingUser } = await db.executeQueryWithParams(checkUserQuery, [email]);

    if (rs && existingUser.length > 0) {
      return res.status(400).json({ message: "Email đã được sử dụng!" });
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo người dùng mới
    const createUserQuery = "INSERT INTO user (username, email, password, role) VALUES (?, ?, ?, ?)";
    const { rs: userCreated, data: result } = await db.executeQueryWithParams(createUserQuery, [username, email, hashedPassword, "USER"]);

    if (!userCreated) {
      return res.status(500).json({ message: "Tạo người dùng thất bại!" });
    }

    // Lấy ID của người dùng vừa tạo
    const userId = result.insertId;

    // Tạo ví cho người dùng mới (Chưa xử lý ví nếu cần thiết)
    // const createWalletQuery = "INSERT INTO wallet (userId) VALUES (?)";
    // const { rs: walletCreated } = await db.executeQueryWithParams(createWalletQuery, [userId]);

    // if (!walletCreated) {
    //   return res.status(500).json({ message: "Tạo ví thất bại!" });
    // }

    res.status(201).json({
      message: "User and wallet created successfully",
      user: { id: userId, username, email, role: "USER" },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create user and wallet!" });
  }
};

// Đăng nhập người dùng
export const login = async (req, res) => {
  const { email, password } = req.body;

  // Kiểm tra nếu thiếu email hoặc password
  if (!email || !password) {
    return res.status(400).json({ message: "Vui lòng cung cấp email và mật khẩu." });
  }

  try {
    // Kiểm tra người dùng trong cơ sở dữ liệu
    const query = "SELECT * FROM user WHERE email = ?";
    const { rs, data } = await db.executeQueryWithParams(query, [email]);

    if (!rs || data.length === 0) {
      return res.status(400).json({ message: "Thông tin đăng nhập không hợp lệ!" });
    }

    const user = data[0];

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(400).json({ message: "Thông tin đăng nhập không hợp lệ!" });

    // Tạo JWT token
    const age = 1000 * 60 * 60 * 24 * 7; // 7 ngày
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        isAdmin: user.role === "ADMIN",
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: age }
    );

    // Trả về token trong cookie và thông tin người dùng
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
};

// Đăng xuất người dùng
export const logout = (req, res) => {
  res.clearCookie("token").status(200).json({ message: "Logout Successful" });
};
