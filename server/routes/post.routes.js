import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  createPost,
  deletePost,
  getAllPosts,
  updatePost,
  commentOnPost,
  deleteComment,
  updateComment,
  likeUnlikePost,
} from "../controllers/post.controller.js";

const router = express.Router();

router.get("/all", getAllPosts);
// router.get("/view/:id", viewPostById);
router.post("/create", protectRoute, createPost);
router.post("/delete/:id", protectRoute, deletePost);
router.post("/update/:id", protectRoute, updatePost);
router.post("/like/:id", protectRoute, likeUnlikePost);
router.post("/comment/:id", protectRoute, commentOnPost);
router.post("/comment/delete/:postId/:id", protectRoute, deleteComment);
router.post("/comment/update/:postId/:id", protectRoute, updateComment);

export default router;
