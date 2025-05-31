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

// controllers/package.controller.js


export const getAllPackages = async (req, res) => {
  try {
    const rows = await db.executeQueryAsyncDB(`SELECT * FROM package ORDER BY id ASC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách gói tin.' });
  }
};

export const getPackageById = async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await db.executeQueryAsyncDB(`SELECT * FROM package WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy gói tin.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin gói tin.' });
  }
};

export const createPackage = async (req, res) => {
  const { name, price, type } = req.body;
  if (!name || !price || !type) return res.status(400).json({ message: 'Thiếu thông tin.' });

  try {
    await db.executeQueryAsyncDB(`INSERT INTO package (name, price, type) VALUES (?, ?, ?)`, [name, price, type]);
    res.json({ message: 'Thêm gói tin thành công.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi thêm gói tin.' });
  }
};

export const updatePackage = async (req, res) => {
  const { id } = req.params;
  const { name, price, type } = req.body;

  try {
    const result = await db.executeQueryAsyncDB(
      `UPDATE package SET name = ?, price = ?, type = ? WHERE id = ?`,
      [name, price, type, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy gói tin để cập nhật.' });

    res.json({ message: 'Cập nhật gói tin thành công.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi cập nhật gói tin.' });
  }
};


export const deletePackage = async (req, res) => {
    const { id } = req.params;
  
    try {
      const result = await db.executeQueryAsyncDB(`DELETE FROM package WHERE id = ?`, [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Không tìm thấy gói tin để xóa.' });
      }
  
      res.json({ message: 'Đã xóa gói tin.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Lỗi server khi xóa gói tin.' });
    }
  };
  