import express from 'express'
import {verifyToken} from "../middleware/verifyToken.js"
import upload from '../middleware/multer.js';
import { verified,report,countReport,registerVisit,getPostsByUser,isFavorite  ,getPostImages,getFavoritePosts, deletePost, getPost, getFilteredPosts, updatePost,savePost,updatePostStatus,createPost } from '../controllers/post.controller.js';
const router = express.Router()

router.get("/", getFilteredPosts);
router.get("/:id", getPost);

router.get('/user/:id', getPostsByUser);
router.get('/images/:postId', getPostImages);

router.put("/:id", updatePost);
router.delete("/:id", deletePost);
router.post('/save-post', savePost);
router.post('/update-status', updatePostStatus);

router.get('/favorites/:userId', getFavoritePosts);
router.post("/create", createPost)

router.get('/is-favorite', isFavorite);
router.post('/register', registerVisit);

router.put('/:id/verify',verified)
router.post('/:id/report',report)
router.get('/:id/report-count',countReport)
export default router