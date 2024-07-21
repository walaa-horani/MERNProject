const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { JWT_SECRET } = process.env;
const bcrypt = require('bcrypt');
const secret = "walaa"
const jwt = require('jsonwebtoken')
const authMiddleware = require("./auth");
const multer = require('multer');

require('dotenv').config();


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



router.post('/register', upload.single('file'), async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  const file = req.file ? req.file.filename : null;
  const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

    // Example validation (you should implement your own validation logic)
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
  
    try {
      // Check if user already exists
      let user = await User.findOne({ email });
  
      if (user) {
        return res.status(400).json({ error: 'User already exists' });
      }
  
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10); // 10 is the saltRounds
  
      // Create a new user instance with hashed password
      user = new User({
        username,
        email,
        password: hashedPassword,
        file: file ? `${basePath}${file}` : null,
      });
  
      // Save user to database
      await user.save();
  
      res.json({ message: 'Registration successful', user });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).send('Server Error');
    }
  });
  

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
  
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
  
      const payload = { user: { id: user._id } };
  
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "3d" },
        (err, token) => {
          if (err) throw err;
  
          // Set the token in the cookie
          res.cookie('token', token, { httpOnly: true, secure: false });
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  



  router.get('/profile', authMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  
module.exports = router;
