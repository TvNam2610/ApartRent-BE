import Database from "../database/database.js";// Nhập lớp Database để thực hiện truy vấn MySQL
const db = new Database(); // Khởi tạo đối tượng Database
import cloudinary from "../utils/cloudinary.js";


// Lấy tất cả bài đăng với phân trang và bộ lọc
export const getPosts = async (req, res) => {
  const {
    page = 1,                // Trang hiện tại
    limit = 10,              // Số bài đăng mỗi trang
    postStatus,              // Trạng thái bài đăng (PENDING, APPROVED, REJECTED)
    realEstateStatus,        // Trạng thái bất động sản (FOR_RENT, FOR_SALE)
    minPrice,                // Giá tối thiểu
    maxPrice,                // Giá tối đa
    minArea,                 // Diện tích tối thiểu
    maxArea,                 // Diện tích tối đa
    searchQuery,             // Từ khóa tìm kiếm
    bedrooms,                // Số phòng ngủ
  } = req.query;

  const skip = (page - 1) * limit;  // Tính số bài đăng cần bỏ qua

  // Tạo bộ lọc động cho câu truy vấn
  const filters = {
    status: postStatus || undefined,
    realEstate: {
      status: realEstateStatus || undefined,
      price: {
        gte: minPrice ? parseFloat(minPrice) : undefined,
        lte: maxPrice ? parseFloat(maxPrice) : undefined,
      },
      area: {
        gte: minArea ? parseFloat(minArea) : undefined,
        lte: maxArea ? parseFloat(maxArea) : undefined,
      },
      bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
      location: searchQuery ? { contains: searchQuery, mode: 'insensitive' } : undefined,
    },
  };

  try {
    // Câu truy vấn để lấy bài đăng với bộ lọc và phân trang
    const query = `
      SELECT p.*, r.*, u.username, u.avatar
      FROM post p
      JOIN real_estate r ON p.realEstateId = r.id
      JOIN user u ON p.userId = u.id
      WHERE 1=1
      ${filters.status ? `AND p.status = '${filters.status}'` : ''}
      ${filters.realEstate.status ? `AND r.status = '${filters.realEstate.status}'` : ''}
      ${filters.realEstate.price.gte ? `AND r.price >= ${filters.realEstate.price.gte}` : ''}
      ${filters.realEstate.price.lte ? `AND r.price <= ${filters.realEstate.price.lte}` : ''}
      ${filters.realEstate.area.gte ? `AND r.area >= ${filters.realEstate.area.gte}` : ''}
      ${filters.realEstate.area.lte ? `AND r.area <= ${filters.realEstate.area.lte}` : ''}
      ${filters.realEstate.bedrooms ? `AND r.bedrooms = ${filters.realEstate.bedrooms}` : ''}
      ${filters.realEstate.location ? `AND r.location LIKE '%${filters.realEstate.location.contains}%'` : ''}
      LIMIT ${skip}, ${limit}
    `;

    const posts = await db.executeQueryAsyncDB(query); // Sử dụng executeQueryAsyncDB để thực thi truy vấn

    // Đếm tổng số bài đăng để hỗ trợ phân trang
    const countQuery = `
      SELECT COUNT(*) AS total 
      FROM post p
      JOIN real_estate r ON p.realEstateId = r.id
      JOIN user u ON p.userId = u.id
      WHERE 1=1
      ${filters.status ? `AND p.status = '${filters.status}'` : ''}
      ${filters.realEstate.status ? `AND r.status = '${filters.realEstate.status}'` : ''}
      ${filters.realEstate.price.gte ? `AND r.price >= ${filters.realEstate.price.gte}` : ''}
      ${filters.realEstate.price.lte ? `AND r.price <= ${filters.realEstate.price.lte}` : ''}
      ${filters.realEstate.area.gte ? `AND r.area >= ${filters.realEstate.area.gte}` : ''}
      ${filters.realEstate.area.lte ? `AND r.area <= ${filters.realEstate.area.lte}` : ''}
      ${filters.realEstate.bedrooms ? `AND r.bedrooms = ${filters.realEstate.bedrooms}` : ''}
      ${filters.realEstate.location ? `AND r.location LIKE '%${filters.realEstate.location.contains}%'` : ''}
    `;
    const totalCountResult = await db.executeQueryAsyncDB(countQuery);
    const totalCount = totalCountResult[0]?.total || 0;

    res.status(200).json({
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      posts,
    });
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ message: 'Failed to retrieve posts' });
  }
};

// Lấy bài đăng duy nhất theo ID
export const getPost = async (req, res) => {
  const { id } = req.params;

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
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).json({ message: 'Failed to get post' });
  }
};

// Thêm bài đăng mới
export const addPost = async (req, res) => {
  const { title, content, realEstate, packageId } = req.body;
  const userId = req.userId;  // Lấy userId từ token (đã được xác thực trước đó)

  // Đảm bảo có ảnh trong req.files
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No images provided!" });
  }

  try {
    // Upload ảnh lên Cloudinary và lấy URL
    const imageUrls = await Promise.all(
      req.files.map(async (file) => {
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { resource_type: "auto" },  // Tự động nhận diện loại file (image, video, ...)
            (error, result) => {
              if (error) reject(error);
              resolve(result.secure_url); // Trả về URL ảnh đã upload
            }
          ).end(file.buffer);  // Kết thúc stream và upload ảnh
        });
      })
    );

    // Chuyển mảng URL ảnh thành chuỗi JSON
    const imagesJson = JSON.stringify(imageUrls);

    // Thêm bất động sản vào bảng real_estate
    const realEstateQuery = `
      INSERT INTO real_estate (description, price, location, status, bedrooms, bathrooms, area, floor, features, images)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Thực thi truy vấn để thêm bất động sản và lấy realEstateId mới
    const realEstateId = await db.executeInsertReturnId(realEstateQuery, [
      realEstate.description,
      realEstate.price,
      realEstate.location,
      realEstate.status,
      realEstate.bedrooms,
      realEstate.bathrooms,
      realEstate.area,
      realEstate.floor,
      JSON.stringify(realEstate.features),
      imagesJson  // Lưu ảnh dưới dạng chuỗi JSON
    ]);

    // Thêm bài đăng mới vào bảng post
    const postQuery = `
      INSERT INTO post (title, content, status, userId, realEstateId, packageId, createAt)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const postId = await db.executeInsertReturnId(postQuery, [
      title,
      content,
      'PENDING',  // Trạng thái bài đăng mặc định là 'PENDING'
      userId,
      realEstateId,
      packageId,
    ]);

    res.status(200).json({ message: 'Post and real estate created successfully', postId });
  } catch (err) {
    console.error('Error adding post and real estate:', err);
    res.status(500).json({ message: 'Failed to create post and real estate' });
  }
};
// Cập nhật bài đăng
export const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  const query = `
    UPDATE post
    SET title = ?, description = ?
    WHERE id = ?
  `;

  try {
    const result = await db.executeNonQuery(query, [title, description, id]);
    if (result === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(200).json({ message: 'Post updated successfully' });
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).json({ message: 'Failed to update post' });
  }
};

// Xóa bài đăng
export const deletePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const query = `
    DELETE FROM post
    WHERE id = ? AND userId = ?
  `;

  try {
    const result = await db.executeNonQuery(query, [id, userId]);
    if (result === 0) {
      return res.status(404).json({ message: 'Post not found or not authorized' });
    }
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ message: 'Failed to delete post' });
  }
};

// Lưu bài đăng yêu thích
export const savePost = async (req, res) => {
  const { postId } = req.body;
  const userId = req.userId;

  const query = `
    INSERT INTO favoriteList (userId, postId)
    VALUES (?, ?)
  `;

  try {
    const result = await db.executeInsertReturnId(query, [userId, postId]);
    res.status(200).json({ message: 'Post saved successfully' });
  } catch (err) {
    console.error('Error saving post:', err);
    res.status(500).json({ message: 'Failed to save post' });
  }
};

// Cập nhật trạng thái bài đăng
export const updatePostStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const query = `
    UPDATE post
    SET status = ?
    WHERE id = ?
  `;

  try {
    const result = await db.executeNonQuery(query, [status, id]);
    if (result === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(200).json({ message: 'Post status updated successfully' });
  } catch (err) {
    console.error('Error updating post status:', err);
    res.status(500).json({ message: 'Failed to update post status' });
  }
};
