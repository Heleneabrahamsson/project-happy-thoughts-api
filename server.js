import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/happyThoughts";
mongoose.connect(mongoUrl);

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB!");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

const port = process.env.PORT || 8080;
const app = express();

app.use(cors());
app.use(express.json());

const { Schema, model } = mongoose;

const thoughtSchema = new Schema({
  message: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 140,
  },
  hearts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
});

const Thought = model("Thought", thoughtSchema);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Happy Thoughts API!",
    endpoints: {
      getThoughts: "/thoughts",
      postThought: "/thoughts",
      likeThought: "/thoughts/:thoughtId/like",
    },
  });
});

// GET thoughts - Return a maximum of 20 thoughts
app.get("/thoughts", async (req, res) => {
  try {
    const thoughts = await Thought.find().sort({ createdAt: -1 }).limit(20);
    res.json(thoughts);
  } catch (error) {
    res.status(500).json({
      success: false,
      response: error,
      message: "Could not fetch thoughts",
    });
  }
});

// POST Create a new thought
app.post("/thoughts", async (req, res) => {
  const { message } = req.body;

  try {
    const newThought = await new Thought({ message }).save();
    res.status(201).json({
      success: true,
      response: newThought,
      message: "Thought created successfully",
    });
  } catch (error) {
    res.status(error.name === "ValidationError" ? 400 : 500).json({
      success: false,
      response: error,
      message: "Could not create thought",
    });
  }
});

// POST Increment the hearts of a thought
app.post("/thoughts/:thoughtId/like", async (req, res) => {
  const { thoughtId } = req.params;

  try {
    const updatedThought = await Thought.findByIdAndUpdate(
      thoughtId,
      { $inc: { hearts: 1 } },
      { new: true }
    );

    if (!updatedThought) {
      res.status(404).json({
        success: false,
        response: "Not Found",
        message: "Thought not found",
      });
    } else {
      res.status(200).json({
        success: true,
        response: updatedThought,
        message: "Hearts incremented",
      });
    }
  } catch (error) {
    if (error.name === "CastError") {
      res.status(400).json({
        success: false,
        response: "Invalid thought ID",
        message: "The provided thought ID is invalid",
      });
    } else {
      res.status(500).json({
        success: false,
        response: error,
        message: "Internal Server Error",
      });
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
