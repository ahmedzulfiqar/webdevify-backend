import mongoose from "mongoose";
import cors from "cors";
import express from "express";
import connection from "./db.js";
import Jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
const app = express();
app.use(express.json());
app.use(cors());
app.use(cors());
connection();
const secretKey = "your-secret-key";

//schema

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  requests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  picturePath: {
    type: String,
    default: "",
  },
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  location: String,
  occupation: String,
  bio: String,
});
const User = mongoose.model("User", userSchema);

//POst shecma

const postSchema = mongoose.Schema(
  {
    userId: {},
    name: {
      type: String,
      required: true,
    },
    email: { type: String, required: true },
    description: String,
    picturePath: String,
    userPicturePath: String,
    likes: { type: Array },
    comments: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);
const Post = mongoose.model("Post", postSchema);
//multer storge

app.get("/", async (req, res) => {
  res.json("AOA");
});

//singup

app.post("/user/signup", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      picturePath,
      friends,
      location,
      occupation,
    } = req.body;

    let query = { email: email };
    let result = await User.findOne(query);
    if (result) {
      res.status(409).json({ message: "Email is already in use" });
    } else {
      const user = new User({
        name: name,
        email: email,
        password: password,
        picturePath: picturePath,
        friends: friends,
        location: location,
        occupation: occupation,
      });
      user.save();
      res.json("Regestration SuccessFull");
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//login

app.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Authentication failed" });
    } else {
      if (user.password == password) {
        const token = Jwt.sign({ userId: user._id, user: user }, secretKey);
        const responseObj = {
          token: token,
          user: user,
        };

        res.json(responseObj);
      } else {
        return res.status(401).json({ message: "Authentication failed" });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//authenticate
app.post("/user/authenticate", async (req, res) => {
  const token = await req.body.token;

  Jwt.verify(token, "your-secret-key", async (err, decoded) => {
    if (err) {
      res.status(401).json({ message: err });
    } else {
      const ress = await decoded.user.email;
      const usernew = await User.findOne({ email: ress });
      res.json(usernew);
    }
  });
});

//listofusers

app.get("/user/allusers", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Error fetching users" });
  }
});

//friend request

app.post("/sendreq", async (req, res) => {
  const { from, to } = req.body;
  let query2 = { email: from };
  const fromuser = await User.findOne(query2);
  let query = { email: to };
  let result = await User.updateOne(query, {
    $push: { requests: fromuser._id },
  });
  res.json(result);
});

//confirm request
app.post("/confirmreq", async (req, res) => {
  const { from, to } = req.body;
  let query2 = { email: from };
  const fromuser = await User.findOne(query2);
  let query = { email: to };
  const touser = await User.findOne(query);
  touser.requests = touser.requests.filter(
    (request) => request.toString() !== fromuser._id.toString()
  );
  await touser.save();
  let final = await User.updateOne(query, {
    $push: { friends: fromuser._id },
  });
  let final2 = await User.updateOne(query2, {
    $push: { friends: touser._id },
  });
  res.json(final);
});
//cancelrequest
app.post("/cancelreq", async (req, res) => {
  const { from, to } = req.body;
  let query2 = { email: from };
  const fromuser = await User.findOne(query2);
  let query = { email: to };
  const touser = await User.findOne(query);
  touser.requests = touser.requests.filter(
    (request) => request.toString() !== fromuser._id.toString()
  );
  await touser.save();
  res.json(touser);
});
//delete request
app.post("/getrequests", async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await User.findById(userId).populate("requests");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const response = user.requests;
    res.json({ response });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});
//friends
app.post("/user/friends", async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await User.findById(userId).populate("friends");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const response = user.friends;
    res.json({ response });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});
//new post
app.post("/user/newpost", async (req, res) => {
  try {
    const {
      userId,
      name,
      email,
      description,
      picturePath,
      userPicturePath,
      comments,
      likes,
    } = req.body;
    const post = await new Post({
      userId: userId,
      name: name,
      email: email,
      description: description,
      picturePath: picturePath,
      userPicturePath: userPicturePath,
      comments,
      likes,
    });
    post.save();
    res.json({ message: "Upload successful" }); // Return a JSON response
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//get posts
app.post("/user/getpost", async (req, res) => {
  try {
    const { email } = req.body;
    let query = { email: email };
    let user = await User.findOne(query);
    let result = await Post.find();
    const responseof = result.filter((i) => user.friends.includes(i.userId));
    res.json(responseof);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//get my  posts
app.post("/user/getmypost", async (req, res) => {
  try {
    const { email } = req.body;
    let query = { email: email };
    let result = await Post.find(query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//like posts
app.post("/user/like", async (req, res) => {
  try {
    const { email, postId } = req.body;
    let query = { id: postId };
    let post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { likes: email },
      },
      { new: true }
    );
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//unlike posts
app.post("/user/unlike", async (req, res) => {
  try {
    const { email, postId } = req.body;
    let query = { id: postId };
    let post = await Post.findById(postId);
    post.likes = post.likes.filter((i) => i.toString() !== email.toString());
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//post comment
app.post("/user/postcomment", async (req, res) => {
  try {
    const { email, description, postId } = req.body;
    let user = await User.findOne({ email: email });
    let commentobject = {
      user: user,
      description: description,
    };
    let post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { comments: commentobject },
      },
      { new: true }
    );
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//detail edit
app.post("/edit-details", async (req, res) => {
  const { email, detail } = req.body;
  console.log(detail)
  let query = { email: email };
  const user = await User.findOne(query);
  user.location = await detail.location;
  user.bio = await detail.bio;
  user.occupation = await detail.occupation;
  await user.save();
  res.json(user);
});

//listen

app.listen(8000, () => {
  console.log(`server is running on port 8000`);
});
