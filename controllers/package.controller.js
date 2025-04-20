import Database from "../database/database.js";// Nhập lớp Database để thực hiện truy vấn MySQL
const db = new Database(); // Khởi tạo đối tượng Database

export const getByType = async (req, res) => {
    const { type } = req.query;
    const query = `
        SELECT * FROM package WHERE type = ?
    `;
    try {
        const result = await db.executeQueryAsyncDB(query, [type]);
        console.log(result)
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi truy vấn dữ liệu package' });
    }
};