const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("PDCH-server");
    const userCollection = db.collection("users");
    const suppliesCollection = db.collection("supplies");
    const communityWallCollection = db.collection("communityGratitude");
    const testimonialCollection = db.collection("testimonial");
    const volunteerCollection = db.collection("volunteer");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await userCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await userCollection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await userCollection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email, name: user.name }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // ==============================================================
    // WRITE YOUR CODE HERE
    // ==============================================================

    app.get("/api/v1/supplies", async (req, res) => {
      let result;
      const limit = parseInt(req.query.limit);
      if (limit && limit > 0) {
        result = await suppliesCollection.find().limit(limit).toArray();
      } else {
        result = await suppliesCollection.find().toArray();
      }

      res.send(result);
    });

    app.get("/api/v1/supplies/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await suppliesCollection.findOne(query);
      res.send(result);
    });

    app.post("/api/v1/supplies", async (req, res) => {
      const doc = req.body;
      const result = await suppliesCollection.insertOne(doc);
      res.send(result);
    });

    app.put("/api/v1/supplies/:id", async (req, res) => {
      const id = req.params.id;
      const doc = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          ...doc,
        },
      };
      const result = await suppliesCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/api/v1/supplies/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await suppliesCollection.deleteOne(filter);
      res.send(result);
    });

    // ==============================================================
    // Community Gratitude wall

    app.get("/api/v1/community-gratitude", async (req, res) => {
      const result = await communityWallCollection.find().toArray();
      res.send(result);
    });

    app.post("/api/v1/community-gratitude", async (req, res) => {
      const doc = req.body;

      const { email } = doc;
      const existingUser = await communityWallCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already posted to the Community Gratitude Wall",
        });
      }

      const result = await communityWallCollection.insertOne(doc);
      res.send(result);
    });
    // ==============================================================
    // Testimonial post

    app.get("/api/v1/testimonial", async (req, res) => {
      const result = await testimonialCollection.find().toArray();
      res.send(result);
    });

    app.post("/api/v1/testimonial", async (req, res) => {
      const doc = req.body;

      const { email } = doc;
      const existingUser = await testimonialCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already posted testimonial",
        });
      }
      const result = await testimonialCollection.insertOne(doc);
      res.send(result);
    });

    // ==============================================================
    // volunteer post

    app.get("/api/v1/volunteer", async (req, res) => {
      const result = await volunteerCollection.find().toArray();
      res.send(result);
    });

    app.post("/api/v1/volunteer", async (req, res) => {
      const doc = req.body;
      const { email } = doc;
      const existingUser = await volunteerCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already applied for Volunteer",
        });
      }
      const result = await volunteerCollection.insertOne(doc);
      res.send(result);
    });

    // ==============================================================
    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
