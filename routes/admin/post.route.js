import express from 'express';
// import { verifyToken } from '../../middleware/verifyToken.js';
// import upload from '../../middleware/multer.js';  // Sử dụng multer để xử lý upload ảnh
// import { addPost, updatePost, deletePost } from '../controllers/admin.controller.js'; // Controller cho admin

const router = express.Router();

// Route cho dashboard
router.get('/manage-posts', (req, res) => {
  res.render('admin/postManagement', { title: 'Post Management' });
});

// // Route thêm bài đăng
// router.get('/add-post', verifyToken, (req, res) => {
//   res.render('admin/addPost', { title: 'Add New Post' });
// });

// // Route POST để thêm bài đăng mới
// router.post('/add-post', verifyToken, upload.array('images', 10), addPost);

// // Route cập nhật bài đăng
// router.put('/update-post/:id', verifyToken, updatePost);

// // Route xóa bài đăng
// router.delete('/delete-post/:id', verifyToken, deletePost);

export default router;
