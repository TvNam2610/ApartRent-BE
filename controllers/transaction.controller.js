import Database from "../database/database.js";// Nhập lớp Database để thực hiện truy vấn MySQL
const db = new Database(); // Khởi tạo đối tượng Database


export const logTransaction = async (req, res) => {
    const { userId, amount, type, description } = req.body;
  
    if (!userId || !amount || !type) {
      return res.status(400).json({ message: "Thiếu thông tin giao dịch." });
    }
  
    try {
      const insertQuery = `
        INSERT INTO transaction_history (userId, amount, type, description)
        VALUES (?, ?, ?, ?)
      `;
      await db.executeQueryAsyncDB(insertQuery, [userId, amount, type, description]);
  
      return res.status(201).json({ message: "Ghi lịch sử giao dịch thành công." });
    } catch (error) {
      console.error("Lỗi khi ghi lịch sử giao dịch:", error);
      return res.status(500).json({ message: "Lỗi server khi ghi lịch sử giao dịch." });
    }
};
  