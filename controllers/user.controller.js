import bcrypt from "bcrypt";
import Database from "../database/database.js";// Nhập lớp Database để thực hiện truy vấn MySQL
const db = new Database(); // Khởi tạo đối tượng Database


// export const getUsers = async (req, res) => {
//   try {
//     const users = await prisma.user.findMany();
//     res.status(200).json(users);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Failed to get users!" });
//   }
// };

// export const getUser = async (req, res) => {
//   const id = req.params.id;
//   try {
//     const user = await prisma.user.findUnique({
//       where: { id },
//     });
//     res.status(200).json(user);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Failed to get user!" });
//   }
// };


export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, email, phone, password, avatar, city, district, ward } = req.body;

    try {
        // Lấy user hiện tại
        const user = await db.executeQueryAsyncDB(`SELECT * FROM user WHERE id = ?`, [id]);
        if (!user[0]) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Hash password nếu có thay đổi
        let hashedPassword = user[0].password;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Xử lý address
        let addressId = user[0].addressId;

        if (city || district || ward) {
            if (addressId) {
                // Cập nhật địa chỉ
                await db.executeQueryAsyncDB(
                    `UPDATE address SET city = ?, district = ?, ward = ? WHERE id = ?`,
                    [city, district, ward, addressId]
                );
            } else {
                // Tạo mới địa chỉ
                const address = await db.executeQueryAsyncDB(
                    `INSERT INTO address (city, district, ward) VALUES (?, ?, ?)`,
                    [city, district, ward]
                );
                addressId = address.insertId;

                // Cập nhật addressId cho user
                await db.executeQueryAsyncDB(`UPDATE user SET addressId = ? WHERE id = ?`, [addressId, id]);
            }
        }

        // Cập nhật thông tin user
        await db.executeQueryAsyncDB(
            `UPDATE user SET username = ?, email = ?, phone = ?, password = ?, avatar = ? WHERE id = ?`,
            [username, email, phone, hashedPassword, avatar, id]
        );

        res.status(200).json({ message: 'User updated successfully' });
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ message: 'Failed to update user' });
    }
};



export const getUsers = async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const offset = (page - 1) * limit;

  try {
    // Đếm tổng số bản ghi
    const countResult = await db.executeQueryAsyncDB(
      `SELECT COUNT(*) AS total FROM user WHERE role = 'USER' AND (username LIKE ? OR email LIKE ?)`,
      [`%${search}%`, `%${search}%`]
    );
    const totalRows = countResult[0].total;
    const totalPages = Math.ceil(totalRows / limit);

    // Truy vấn danh sách
    const users = await db.executeQueryAsyncDB(
      `SELECT id, email, username, phone, createAt, 
              IFNULL(status, 'active') AS status 
       FROM user 
       WHERE role = 'USER' AND (username LIKE ? OR email LIKE ? )
       ORDER BY createAt DESC 
       LIMIT ? OFFSET ?`,
      [`%${search}%`, `%${search}%`, Number(limit), Number(offset)]
    );

    res.json({
      users,
      totalPages,
      currentPage: Number(page),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách người dùng.' });
  }
};


// controllers/user.controller.js
export const lockUser = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
  
    if (!reason) {
      return res.status(400).json({ message: 'Vui lòng cung cấp lý do khóa tài khoản.' });
    }
  
    try {
      // Cập nhật trạng thái user thành 'locked'
      await db.executeQueryAsyncDB(`UPDATE user SET status = 'locked' WHERE id = ?`, [id]);
  
      // Ghi log hành động admin (nếu có bảng admin_log)
      await db.executeQueryAsyncDB(
        `INSERT INTO admin_log (adminId, action, postId, description, createdAt)
         VALUES (?, ?, NULL, ?, NOW())`,
        [req.adminId || null, 'LOCK_USER', `Khóa tài khoản ID ${id}: ${reason}`]
      );
  
      res.json({ message: 'Tài khoản đã bị khóa thành công.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Lỗi server khi khóa tài khoản.' });
    }
    };
  

export const getStatistics = async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const [year, monthNum] = month.split('-');

  try {
    const [{ totalPosts }] = await db.executeQueryAsyncDB(`
      SELECT COUNT(*) AS totalPosts 
      FROM post WHERE MONTH(createAt) = ? AND YEAR(createAt) = ?`, [monthNum, year]);

    const [{ newUsers }] = await db.executeQueryAsyncDB(`
      SELECT COUNT(*) AS newUsers 
      FROM user WHERE MONTH(createAt) = ? AND YEAR(createAt) = ?`, [monthNum, year]);


    const [{ transactions }] = await db.executeQueryAsyncDB(`
      SELECT COUNT(*) AS transactions 
      FROM transaction_history WHERE MONTH(createdAt) = ? AND YEAR(createdAt) = ?`, [monthNum, year]);

    // Chart data (ngày trong tháng)
    const transactionData = await db.executeQueryAsyncDB(`
      SELECT DAY(createdAt) AS day, COUNT(*) AS count 
      FROM transaction_history 
      WHERE MONTH(createdAt) = ? AND YEAR(createdAt) = ? 
      GROUP BY day ORDER BY day`, [monthNum, year]);

    const postData = await db.executeQueryAsyncDB(`
      SELECT DAY(createAt) AS day, COUNT(*) AS count 
      FROM post 
      WHERE MONTH(createAt) = ? AND YEAR(createAt) = ? 
      GROUP BY day ORDER BY day`, [monthNum, year]);

    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
    const chartPosts = labels.map(day => {
      const found = postData.find(p => p.day == day);
      return found ? found.count : 0;
    });
    const chartTransactions = labels.map(day => {
      const found = transactionData.find(t => t.day == day);
      return found ? found.count : 0;
    });

    res.json({
      totalPosts,
      newUsers,
      transactions,
      chart: {
        posts: { labels, data: chartPosts },
        transactions: { labels, data: chartTransactions }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi thống kê.' });
  }
};


// export const deleteUser = async (req, res) => {
//   const id = req.params.id;
//   const tokenUserId = req.userId;

//   if (id !== tokenUserId) {
//     return res.status(403).json({ message: "Not Authorized!" });
//   }

//   try {
//     await prisma.user.delete({
//       where: { id },
//     });
//     res.status(200).json({ message: "User deleted" });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Failed to delete users!" });
//   }
// };

// export const savePost = async (req, res) => {
//   const postId = req.body.postId;
//   const tokenUserId = req.userId;

//   try {
//     const savedPost = await prisma.savedPost.findUnique({
//       where: {
//         userId_postId: {
//           userId: tokenUserId,
//           postId,
//         },
//       },
//     });

//     if (savedPost) {
//       await prisma.savedPost.delete({
//         where: {
//           id: savedPost.id,
//         },
//       });
//       res.status(200).json({ message: "Post removed from saved list" });
//     } else {
//       await prisma.savedPost.create({
//         data: {
//           userId: tokenUserId,
//           postId,
//         },
//       });
//       res.status(200).json({ message: "Post saved" });
//     }
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Failed to delete users!" });
//   }
// };

// export const profilePosts = async (req, res) => {
//   const tokenUserId = req.userId;
//   try {
//     const userPosts = await prisma.post.findMany({
//       where: { userId: tokenUserId },
//     });
//     const saved = await prisma.savedPost.findMany({
//       where: { userId: tokenUserId },
//       include: {
//         post: true,
//       },
//     });

//     const savedPosts = saved.map((item) => item.post);
//     res.status(200).json({ userPosts, savedPosts });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Failed to get profile posts!" });
//   }
// };

// export const getNotificationNumber = async (req, res) => {
//   const tokenUserId = req.userId;
//   try {
//     const number = await prisma.chat.count({
//       where: {
//         userIDs: {
//           hasSome: [tokenUserId],
//         },
//         NOT: {
//           seenBy: {
//             hasSome: [tokenUserId],
//           },
//         },
//       },
//     });
//     res.status(200).json(number);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Failed to get profile posts!" });
//   }
// };