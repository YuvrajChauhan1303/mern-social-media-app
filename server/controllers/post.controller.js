import Post from "../models/posts.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    if (posts.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(posts);
  } catch (error) {
    console.log("Error in getAllPosts controller: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const viewPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    const posts = await Post.findById(postId);
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error in View Post Controller:", error);
    res.status(500).json({ error: "Error in View Post Controller" });
  }
};
export const createPost = async (req, res) => {
  try {
    const { text } = req.body;

    let { img } = req.body;

    const userId = req.user._id.toString();

    const user = User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User Not Found!" });
    }

    if (!text && !img) {
      return res.status(400).json({
        error:
          "Post cannot be Empty. You Need to have either an Image or some Text.",
      });
    }

    if (img) {
      const uploadedResponse = cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    const newPost = new Post({
      user: userId,
      text,
      img,
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: "error in Create Post Controller" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: "Post not Found!" });
    }

    if (req.user._id.toString() !== post.user.toString()) {
      return res
        .status(401)
        .json({ error: "You are not authorized to delete this post." });
    }

    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Post deleted successfully!!" });
  } catch (error) {
    res.status(500).json({ error: "Error in Delete Post" });
  }
};

export const updatePost = async (req, res) => {
  const { text, img } = req.body;

  const userId = req.user._id.toString();

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User Not Found!" });
    }

    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post Not Found" });
    }

    if (!text && !img) {
      return res.status(400).json({
        error:
          "Post cannot be empty. You need to have either an image or some text.",
      });
    }

    if (text) {
      post.text = text;
    }

    if (img) {
      if (post.img) {
        const imgId = post.img.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(imgId);
      }

      const uploadedResponse = await cloudinary.uploader.upload(img);
      post.img = uploadedResponse.secure_url;
    }

    await post.save();

    res
      .status(200)
      .json({ message: "Post updated successfully", updatedPost: post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};

export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;

    if (!text) {
      return res.status(401).json({ error: "Comments cannot be empty" });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post Not Found!" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }

    const comment = { user: userId, text };
    post.comments.push(comment);
    await post.save();

    res.status(202).json(post);
  } catch (error) {
    res.status(500).json({ error: "Error in Comment On Post" });
  }
};

export const deleteComment = async (req, res) => {
  const postId = req.params.postId;
  const commentId = req.params.id;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post Not Found" });
    }

    const commentIndex = post.comments.findIndex(
      (comment) => comment._id == commentId.toString()
    );

    if (commentIndex === -1) {
      return res.status(404).json({ error: "Comment Not Found" });
    }

    post.comments.splice(commentIndex, 1);

    await post.save();

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};

export const updateComment = async (req, res) => {
  const postId = req.params.postId;
  const commentId = req.params.id;
  const { text } = req.body;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post Not Found" });
    }

    const comment = post.comments.find(
      (comment) => comment._id == commentId.toString()
    );

    if (!comment) {
      return res.status(404).json({ error: "Comment Not Found" });
    }

    if (!text) {
      return res.status(401).json({ error: "Comments cannot be Empty!" });
    }

    comment.text = text;

    await post.save();

    res.status(200).json({
      message: "Comment updated successfully",
      updatedComment: comment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};

export const likeUnlikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const userLikedPost = post.likes.includes(userId);

    if (userLikedPost) {
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

      const updatedLikes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
      res.status(200).json(updatedLikes);
    } else {
      post.likes.push(userId);
      await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
      await post.save();

      const notification = new Notification({
        from: userId,
        to: post.user,
        type: "like",
      });
      await notification.save();

      const updatedLikes = post.likes;
      res.status(200).json(updatedLikes);
    }
  } catch (error) {
    console.log("Error in likeUnlikePost controller: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLikedPosts = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    res.status(200).json(likedPosts);
  } catch (error) {
    console.log("Error in getLikedPosts controller: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFollowingPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const following = user.following;

    const feedPosts = await Post.find({ user: { $in: following } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    res.status(200).json(feedPosts);
  } catch (error) {
    console.log("Error in getFollowingPosts controller: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    res.status(200).json(posts);
  } catch (error) {
    console.log("Error in getUserPosts controller: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};