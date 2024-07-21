// routes/posts.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const Post = require('../models/Post');


const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("invalid image type");
    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, './public/uploads');
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const upload = multer({ storage: storage });

// POST endpoint to handle new post creation

router.get('/search', async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim() === '') {
    return res.status(400).json({ message: 'Search query is required' });
  }

  // Sanitize the query
  const sanitizedQuery = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

  try {
    const searchCriteria = {
      $or: [
        { title: { $regex: sanitizedQuery, $options: 'i' } },
        { summary: { $regex: sanitizedQuery, $options: 'i' } },
        { content: { $regex: sanitizedQuery, $options: 'i' } },
      ],
    };

    const posts = await Post.find(searchCriteria);

    res.json(posts);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
});


router.post('/', upload.single('file'), async (req, res) => {
  const { title, summary, content } = req.body;
  const file = req.file ? req.file.filename : null;
  const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

  try {
    const newPost = new Post({
      title,
      summary,
      content,
      file: file ? `${basePath}${file}` : null,
    });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).send('Error creating post');
  }
});


router.get('/postList', async (req, res) => {
    try {
      const posts = await Post.find();
      res.json(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const posts = await Post.findById(req.params.id);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });


  router.put('/:id', upload.single('file'), async (req, res) => {
    try {
      const { title, summary, content } = req.body;
      const file = req.file ? req.file.filename : null;
  
      const updateData = { title, summary, content };
      if (file) {
        updateData.file = `/public/uploads/${file}`;
      }
  
      const updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );
  
      if (!updatedPost) {
        return res.status(404).send({ message: 'Post not found' });
      }
  
      res.send(updatedPost);
    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).send({ message: 'Error updating post' });
    }
  });



  router.delete('/:id', async (req, res) => {
    try {
      const postId = req.params.id;
  
      // Find the post by ID and delete it
      const deletedPost = await Post.findByIdAndDelete(postId);
  
      if (!deletedPost) {
        return res.status(404).send({ message: 'Post not found' });
      }
  
      res.send({ message: 'Post deleted successfully', deletedPost });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).send({ message: 'Error deleting post' });
    }
  });


  
module.exports = router;
