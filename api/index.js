const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const userRouter = require("./routes/user");
const cookieParser = require("cookie-parser");
const postsRouter = require('./routes/posts');
const contactRouter = require('./routes/contact');
const authRouter = require('./routes/auth');

dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true, 
}));
app.use(express.json());
app.use(cookieParser());



// Use the API variable from the .env file
const api = process.env.API;
app.use(`/${api}/users`, userRouter);
app.use(`/${api}/posts`, postsRouter);
app.use(`/${api}/contact`, contactRouter);
app.use(`/${api}/auth`, authRouter);

// Serve static files from the 'uploads' directory
app.use('/public/uploads', express.static('public/uploads'));

mongoose.connect(process.env.uri).then(() => {
    console.log("Database connected");
}).catch((err) => {
    console.log(err);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});