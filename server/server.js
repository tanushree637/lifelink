const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware - CORS with specific origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Firebase
const { initializeFirebase } = require("./config/firebase");

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/donors", require("./routes/donors"));
app.use("/api/recipients", require("./routes/recipients"));
app.use("/api/hospitals", require("./routes/hospitals"));
app.use("/api/admin", require("./routes/admin"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "LifeLink Server is running" });
});

const PORT = process.env.PORT || 5000;

// Initialize Firebase and start server
initializeFirebase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`LifeLink Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize Firebase:", error);
    process.exit(1);
  });
