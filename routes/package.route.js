import express from 'express'
// import {verifyToken} from "../middleware/verifyToken.js"
// import upload from '../middleware/multer.js';
import { getByType } from '../controllers/package.controller.js';
const router = express.Router()

router.get("/getByType", getByType);

export default router