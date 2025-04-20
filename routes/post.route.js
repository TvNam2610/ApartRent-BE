import express from 'express'
import {verifyToken} from "../middleware/verifyToken.js"
import upload from '../middleware/multer.js';
import { getPostsByUser,addPost, deletePost, getPost, getPosts, updatePost,savePost,updatePostStatus,createPost } from '../controllers/post.controller.js';
const router = express.Router()

router.get("/", getPosts);
router.get("/:id", getPost);

router.get('/user/:id', getPostsByUser);


router.post("/", verifyToken,upload, addPost);
router.put("/:id", updatePost);
router.delete("/:id", verifyToken, deletePost);
router.post('/save-post', verifyToken, savePost);
router.put('/update-status/:id', updatePostStatus);


router.post("/create", createPost)


export default router