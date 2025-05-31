import Database from "../database/database.js";// Nhập lớp Database để thực hiện truy vấn MySQL
const db = new Database(); // Khởi tạo đối tượng Database
import cloudinary from "../utils/cloudinary.js";
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { console } from "inspector";
dotenv.config();


//get post by user
// controllers/post.controller.js

export const getPostsByUser = async (req, res) => {
  const { id } = req.params;
  const {
    keyword = '',
    status = '',
    packageType = '',
    page = 1,
    limit = 10
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    // Xây dựng điều kiện lọc động
    let whereClauses = ['p.userId = ?'];
    const params = [id];

    if (keyword) {
      whereClauses.push('(p.title LIKE ? OR r.location LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (status) {
      whereClauses.push('p.status = ?');
      params.push(status);
    }

    if (packageType) {
      whereClauses.push('pk.type = ?');
      params.push(packageType);
    }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Lấy dữ liệu bài đăng
    const posts = await db.executeQueryAsyncDB(`
      SELECT 
        p.id, p.title, p.status,
        pk.type AS packageType, pk.price AS amount,
        p.startDate, r.location,r.price,
        (SELECT imageUrl FROM post_image WHERE postId = p.id LIMIT 1) AS thumbnail
      FROM post p
      JOIN real_estate r ON p.realEstateId = r.id
      JOIN package pk ON p.packageId = pk.id
      ${whereSQL}
      ORDER BY p.createAt DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    // Lấy tổng số bài để phân trang
    const [countResult] = await db.executeQueryAsyncDB(`
      SELECT COUNT(*) as total
      FROM post p
      JOIN real_estate r ON p.realEstateId = r.id
      JOIN package pk ON p.packageId = pk.id
      ${whereSQL}
    `, params);

    res.status(200).json({
      posts,
      total: countResult.total,
    });
  } catch (err) {
    console.error('Lỗi lấy bài đăng:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy bài đăng' });
  }
};



//Tạo bài đăng
export const createPost = async (req, res) => {
  const {
    title,
    content,
    description,
    price,
    location,
    status = "PENDING",
    bedrooms,
    bathrooms,
    area,
    floor,
    features,
    images,        // array url từ Cloudinary
    userId,
    packageId,
    startDate,
    days,
    contactName,
    phone,
    email,
    clickCount,
    guestCount,
    type
  } = req.body;

  try {
    // 1. Tạo real_estate
    const realEstateResult = await db.executeQueryAsyncDB(
      `INSERT INTO real_estate (description, price, location, status, bedrooms, bathrooms, area, floor, features)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [description, price, location, type, bedrooms, bathrooms, area, floor, features]    
    );
    const realEstateId = realEstateResult.insertId;

    // 2. Tạo post
    const postResult = await db.executeQueryAsyncDB(
      `INSERT INTO post (title, content, status, createAt, realEstateId, userId, packageId, startDate, endDate, clickCount, guestCount, dayCount, contactName, phone,email)
       VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, DATE_ADD(?, INTERVAL ? DAY), ?, ?, ?, ?,?,?)`,
      [title, content,status, realEstateId, userId, packageId, startDate, startDate, days, clickCount || 0, guestCount || 0, days,contactName,phone,email]
    );
    const postId = postResult.insertId;

    // 3. Lưu ảnh vào post_image
    if (Array.isArray(images) && images.length > 0) {
      // dùng multiple value insert
      const insertImagesQuery = `
        INSERT INTO post_image (postId, imageUrl) VALUES ${images
          .map(() => '(?, ?)')
          .join(', ')}
      `;
      const imageValues = images.flatMap((url) => [postId, url]);

      await db.executeQueryAsyncDB(insertImagesQuery, imageValues);
    }

    return res.status(201).json({ success: true, message: 'Tạo bài đăng thành công', postId });
  } catch (err) {
    console.error('Lỗi khi tạo bài đăng:', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi tạo bài đăng' });
  }
};


// lấy danh sách bài đăng phân trang
export const getFilteredPosts = async (req, res) => {
  const {
    searchQuery  = '',
    realEstateStatus = '', // Lọc theo trạng thái bất động sản
    minPrice = '',
    maxPrice = '',
    minArea = '',
    maxArea = '',
    bedrooms = '',
    status = 'APPROVED', // Mặc định là 'APPROVED'
    page = 1,
    limit = 10,
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    // Xây dựng điều kiện lọc động
    let whereClauses = ['p.status = ?']; // Chỉ lọc bài đăng với status 'APPROVED'
    const params = [status];

    // Nếu có từ khóa tìm kiếm (tiêu đề hoặc địa điểm)
    if (searchQuery) {
      whereClauses.push('(p.title LIKE ? OR r.location LIKE ?)');
      params.push(`%${searchQuery }%`, `%${searchQuery }%`);
    }

    // Nếu có trạng thái bất động sản
    if (realEstateStatus) {
      whereClauses.push('r.status = ?');
      params.push(realEstateStatus);
    }

    // Nếu có khoảng giá (minPrice và maxPrice)
    if (minPrice > 0 , maxPrice> 0 && maxPrice> minPrice) {
      whereClauses.push('r.price BETWEEN ? AND ?');
      params.push(minPrice, maxPrice);
    }

    // Nếu có khoảng diện tích (minArea và maxArea)
    if (minArea > 0, maxArea>0 && maxArea> minArea) {
      whereClauses.push('r.area BETWEEN ? AND ?');
      params.push(minArea, maxArea);
    }

    // Nếu có số phòng ngủ (bedrooms)
    if (bedrooms) {
      whereClauses.push('r.bedrooms >= ?');
      params.push(bedrooms);
    }

    // Tạo phần câu lệnh WHERE
    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Lấy dữ liệu bài đăng với điều kiện lọc
    const posts = await db.executeQueryAsyncDB(`
      SELECT 
        p.id, p.title, p.status,p.verified,
        pk.type AS packageType, pk.price AS amount,u.username,u.email,
        p.startDate, r.location, r.price AS realEstatePrice,p.createAt,
        r.bedrooms, r.bathrooms, r.area, r.floor, r.status AS realEstateStatus,
        (SELECT imageUrl FROM post_image WHERE postId = p.id LIMIT 1) AS thumbnail
      FROM post p
      JOIN user u ON p.userId = u.id
      JOIN real_estate r ON p.realEstateId = r.id
      JOIN package pk ON p.packageId = pk.id
      ${whereSQL}
      ORDER BY p.createAt DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    // Lấy tổng số bài đăng để phân trang
    const [countResult] = await db.executeQueryAsyncDB(`
      SELECT COUNT(*) as total
      FROM post p
      JOIN real_estate r ON p.realEstateId = r.id
      JOIN package pk ON p.packageId = pk.id
      ${whereSQL}
    `, params);

    // Thêm truy vấn để đếm số bản ghi theo từng trạng thái
    let statusCountsQuery = `
    SELECT 
        SUM(CASE WHEN status = "PENDING" THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN status = "REJECTED" THEN 1 ELSE 0 END) AS rejected_count,
        SUM(CASE WHEN status = "APPROVED" THEN 1 ELSE 0 END) AS approved_count
    FROM post
`;

    const statusCountsResult = await db.executeQueryAsyncDB(statusCountsQuery, []);

    const pendingCount = statusCountsResult[0].pending_count || 0;
    const rejectedCount = statusCountsResult[0].rejected_count || 0;
    const approvedCount = statusCountsResult[0].approved_count || 0;

    const totalItems = countResult.total;
    const totalPages = Math.ceil(totalItems / limit);


    res.status(200).json({
      posts,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit
    },
      statusCounts: {
          pending: pendingCount,
          rejected: rejectedCount,
          approved: approvedCount
      }
    });
  } catch (err) {
    console.error('Lỗi lấy bài đăng:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy bài đăng' });
  }
};


// Lấy bài đăng duy nhất theo ID
export const getPost = async (req, res) => {
  
  const { id } = req.params;
  console.log('Fetching post with ID:', id);
  const query = `
    SELECT p.*, r.*, u.username, u.avatar
    FROM post p
    JOIN real_estate r ON p.realEstateId = r.id
    JOIN user u ON p.userId = u.id
    WHERE p.id = ?
  `;

  

  try {
    const post = await db.executeQueryAsyncDB(query, [id]);
    if (!post.length) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(200).json(post[0]);
    // Ghi lại lượt truy cập
    await db.executeQueryAsyncDB(
      `INSERT INTO visit_log (postId, userId, ip, userAgent)
      VALUES (?, ?, ?, ?)`,
      [id, req.user?.id || null, req.ip, req.headers['user-agent']]
    );
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).json({ message: 'Failed to get post' });
  }
};


// Lấy danh sách ảnh của bài đăng theo postId
export const getPostImages = async (req, res) => {
  const { postId } = req.params;

  const query = `
    SELECT id, imageUrl 
    FROM post_image 
    WHERE postId = ?
  `;

  try {
    const images = await db.executeQueryAsyncDB(query, [postId]);
    res.status(200).json(images); // Trả về mảng ảnh
  } catch (err) {
    console.error('Error fetching post images:', err);
    res.status(500).json({ message: 'Failed to get post images' });
  }
};


// Cập nhật bài đăng
export const updatePost = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    price,
    location,
    description
  } = req.body;

  try {
    await db.executeQueryAsyncDB(`
      UPDATE post p
      JOIN real_estate r ON p.realEstateId = r.id
      SET p.title = ?, r.price = ?, r.location = ?, r.description = ?
      WHERE p.id = ?
    `, [title, price, location, description, id]);

    res.status(200).json({ message: 'Cập nhật thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xóa bài đăng
export const deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Lấy id bất động sản liên quan
    const [postInfo] = await db.executeQueryAsyncDB(`SELECT realEstateId FROM post WHERE id = ?`, [id]);
    const realEstateId = postInfo?.realEstateId;

    if (!realEstateId) return res.status(404).json({ message: 'Không tìm thấy bài đăng hoặc real estate' });

    // 2. Xoá hình ảnh liên quan
    await db.executeQueryAsyncDB(`DELETE FROM post_image WHERE postId = ?`, [id]);

    // 3. Xoá bài đăng
    await db.executeQueryAsyncDB(`DELETE FROM post WHERE id = ?`, [id]);

    // 4. Kiểm tra xem real estate có còn được dùng không
    const [check] = await db.executeQueryAsyncDB(
      `SELECT COUNT(*) AS count FROM post WHERE realEstateId = ?`,
      [realEstateId]
    );

    if ((check?.count || 0) === 0) {
      await db.executeQueryAsyncDB(`DELETE FROM real_estate WHERE id = ?`, [realEstateId]);
    }

    res.status(200).json({ message: 'Xoá bài đăng thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi xoá bài đăng' });
  }
};

export const savePost = async (req, res) => {
  const { postId, userId } = req.body;

  try {
    // Kiểm tra nếu bài viết đã được lưu
    const [existing] = await db.executeQueryAsyncDB(
      'SELECT * FROM favoritelist WHERE userId = ? AND postId = ?',
      [userId, postId]
    );

    if (existing) {
      // Nếu đã tồn tại, xóa khỏi danh sách yêu thích
      await db.executeQueryAsyncDB(
        'DELETE FROM favoritelist WHERE userId = ? AND postId = ?',
        [userId, postId]
      );
      return res.status(200).json({ message: 'Đã xóa khỏi danh sách yêu thích' });
    }

    // Nếu chưa tồn tại, thêm vào danh sách yêu thích
    await db.executeQueryAsyncDB(
      'INSERT INTO favoritelist (userId, postId, createdAt) VALUES (?, ?, NOW())',
      [userId, postId]
    );

    res.status(200).json({ message: 'Đã thêm vào danh sách yêu thích' });

  } catch (err) {
    console.error('Lỗi khi xử lý yêu thích:', err);
    res.status(500).json({ message: 'Có lỗi xảy ra khi lưu bài viết yêu thích' });
  }
};

// Cập nhật trạng thái bài đăng

export const updatePostStatus = async (req, res) => {
  const { postId, status, reason, email, title, username } = req.body;

  if (!postId || !status || !email || !title) {
      return res.status(400).json({ success: false, message: 'Thiếu dữ liệu' });
  }

  try {
      // Cập nhật trạng thái bài đăng
      await db.executeQueryAsyncDB('UPDATE post SET status = ? WHERE id = ?', [status, postId]);

      // Gửi email thông báo
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
          }
      });

      const html = `
        <p>Xin chào <b>${username}</b>,</p>
        <p>Bài đăng <b>${title}</b> (ID: ${postId}) đã được <b style="color:${status === 'APPROVED' ? 'green' : 'red'}">
        ${status === 'APPROVED' ? 'phê duyệt' : status === 'HIDDEN' ? 'ẩn' : 'từ chối'}</b>.</p>
        ${status === 'REJECTED' && reason ? `<p><b>Lý do:</b> ${reason}</p>` : ''}
        <p>Trân trọng,<br>Ban quản trị Apartrent</p>
      `;

      await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: `Bài đăng của bạn đã được ${status === 'APPROVED' ? 'phê duyệt' : status === 'HIDDEN' ? 'ẩn' : 'từ chối'}`,
          html
      });

      return res.status(200).json({ success: true, message: 'Cập nhật & gửi email thành công' });
  } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

export const registerVisit = async (req, res) => {
  const {
      name,
      phone,
      email,
      visitDate,
      visitTime,
      message,
      postTitle,
      username,
      ownerEmail // email người bán
  } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!name || !phone || !email || !visitDate || !visitTime || !postTitle || !ownerEmail) {
      return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập đầy đủ thông tin bắt buộc.',
      });
  }

  try {
      // Tạo transporter gửi email
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
          },
      });

      // Nội dung email gửi đến người bán
      const htmlContent = `
          <h3>📩 Yêu cầu tham quan căn hộ: <strong>${postTitle}</strong></h3>
          <p>Một khách hàng đã gửi yêu cầu tham quan căn hộ bạn đăng:</p>
          <ul>
              <li><strong>Họ tên:</strong> ${name}</li>
              <li><strong>Điện thoại:</strong> ${phone}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Thời gian tham quan:</strong> ${visitDate} lúc ${visitTime}</li>
              <li><strong>Lời nhắn:</strong> ${message || 'Không có lời nhắn.'}</li>
          </ul>
          <p><i>Người gửi quan tâm đến căn hộ bạn đã đăng (người đăng: ${username || 'không xác định'}).</i></p>
      `;

      // Gửi email cho người bán
      await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: ownerEmail,
          subject: `📝 Yêu cầu tham quan căn hộ: ${postTitle}`,
          html: htmlContent,
      });

      return res.status(200).json({
          success: true,
          message: 'Đã gửi email thông báo cho người bán.',
      });
  } catch (error) {
      console.error('Lỗi khi gửi email:', error);
      return res.status(500).json({
          success: false,
          message: 'Không thể gửi email. Vui lòng thử lại sau.',
      });
  }
};




// GET /posts/favorites/:userId
export const getFavoritePosts = async (req, res) => {
  const { userId } = req.params;

  try {
    const posts = await db.executeQueryAsyncDB(
      ` SELECT 
        p.id, p.title, p.status,
     
        p.startDate, r.location, r.price AS realEstatePrice,
        r.bedrooms, r.bathrooms, r.area, r.floor, r.status AS realEstateStatus,
        (SELECT imageUrl FROM post_image WHERE postId = p.id LIMIT 1) AS thumbnail
FROM favoritelist f
JOIN post p ON f.postId = p.id
JOIN user u ON p.userId = u.id
LEFT JOIN real_estate r ON p.realEstateId = r.id
WHERE f.userId = ?
`,
      [userId]
    );

    res.status(200).json(posts);
  } catch (err) {
    console.error('Error fetching favorite posts:', err);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách bài viết yêu thích' });
  }
};


// GET /posts/is-favorite?userId=1&postId=123
export const isFavorite = async (req, res) => {
  const { userId, postId } = req.query;

  try {
    const result = await db.executeQueryAsyncDB(
      'SELECT 1 FROM favoritelist WHERE userId = ? AND postId = ?',
      [userId, postId]
    );

    res.json({ isFavorite: !!result });
  } catch (err) {
    console.error('Error checking favorite:', err);
    res.status(500).json({ message: 'Internal error' });
  }
};




// Đánh dấu tin đã xác minh (Admin dùng)
export const verified = async (req, res) => {
  try {
    await db.executeQueryAsyncDB('UPDATE post SET verified = true WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Đã xác minh bài đăng.' });
  } catch (err) {
    console.error('Lỗi xác minh bài:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Báo cáo bài đăng vi phạm/lừa đảo
export const report = async (req, res) => {
  const { reason } = req.body;
  try {
    await db.executeQueryAsyncDB(
      'INSERT INTO post_reports (postId, reason) VALUES (?, ?)',
      [req.params.id, reason || 'Không rõ lý do']
    );
    res.json({ success: true, message: 'Đã gửi báo cáo.' });
  } catch (err) {
    console.error('Lỗi gửi báo cáo:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Lấy số lượt báo cáo cho một bài đăng
export const countReport =  async (req, res) => {
  try {
    const result = await db.executeQueryAsyncDB(
      'SELECT COUNT(*) AS reportCount FROM post_reports WHERE postId = ?',
      [req.params.id]
    );
    res.json({ success: true, reportCount: result[0]?.reportCount || 0 });
  } catch (err) {
    console.error('Lỗi lấy số lượt báo cáo:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};