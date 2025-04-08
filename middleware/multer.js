import multer from 'multer';
import path from 'path';

// Cấu hình Multer sử dụng bộ nhớ (memoryStorage), lưu ảnh vào bộ nhớ tạm thời
const storage = multer.memoryStorage();

// Kiểm tra loại file để chỉ cho phép upload ảnh (jpeg, jpg, png, gif)
const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|gif/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true); // Nếu là ảnh hợp lệ, cho phép upload
  } else {
    cb('Error: Only images are allowed'); // Nếu không phải ảnh, báo lỗi
  }
};

// Cấu hình Multer
const upload = multer({
  storage: storage,     // Lưu file vào bộ nhớ tạm thời
  fileFilter: fileFilter, // Kiểm tra loại file
}).array('images', 5);  // Cho phép gửi tối đa 5 ảnh với key là 'images[]'

export default upload;
