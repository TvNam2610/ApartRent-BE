import express from 'express'
import {verifyToken} from "../middleware/verifyToken.js"
import { addPost, deletePost, getPost, getPosts, updatePost,savePost,updatePostStatus } from '../controllers/post.controller.js';
const router = express.Router()

router.get("/", getPosts);
router.get("/:id", getPost);


router.post("/", verifyToken, addPost);
router.put("/:id", verifyToken, updatePost);
router.delete("/:id", verifyToken, deletePost);
router.post('/save-post', verifyToken, savePost);
router.put('/update-status/:id', updatePostStatus);



export default router