import express from 'express'
import {verifyToken} from "../middleware/verifyToken.js"
import upload from '../middleware/multer.js';
import { getPostsByUser,isFavorite  ,getPostImages,getFavoritePosts, deletePost, getPost, getFilteredPosts, updatePost,savePost,updatePostStatus,createPost } from '../controllers/post.controller.js';
const router = express.Router()

router.get("/", getFilteredPosts);
router.get("/:id", getPost);

router.get('/user/:id', getPostsByUser);
router.get('/images/:postId', getPostImages);

router.put("/:id", updatePost);
router.delete("/:id", deletePost);
router.post('/save-post', savePost);
router.put('/update-status/:id', updatePostStatus);

router.get('/favorites/:userId', getFavoritePosts);
router.post("/create", createPost)

router.get('/is-favorite', isFavorite);
export default router