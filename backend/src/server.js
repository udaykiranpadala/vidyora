import express from "express";
import cors from "cors";
import compression from "compression";
import dotenv from "dotenv";
import connectDB, { disconnectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import attemptRoutes from "./routes/attemptRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import { getExecutionStatus } from "./utils/judge0.js";

dotenv.config();

const app = express();

app.use(compression());

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim().replace(/\/+$/, ""))
  : ["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, "");
      if (
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.includes("vercel.app") ||
        cleanOrigin.includes("localhost") ||
        cleanOrigin.includes("127.0.0.1")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Bounded request body limits sized safely for low-memory Render instances (512MB RAM)
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ limit: "500kb", extended: true }));

// Health check with memory observability and execution status
app.get("/api/health", (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: "ok",
    message: "Exam platform API is running",
    uptimeSeconds: Math.round(process.uptime()),
    memoryMB: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
    },
    execution: getExecutionStatus(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/public", publicRoutes);

// Generic error-handling middleware to prevent process crashes
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Payload too large. Please shorten your input." });
  }
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = "0.0.0.0";

let server;

connectDB().then(() => {
  server = app.listen(PORT, HOST, () => {
    const mem = process.memoryUsage();
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`📊 Memory baseline: RSS ${Math.round(mem.rss / 1024 / 1024)}MB | Heap ${Math.round(mem.heapUsed / 1024 / 1024)}MB`);
  });
}).catch((err) => {
  console.error("Failed to start server due to database connection error:", err.message);
  process.exit(1);
});

// Graceful shutdown handling for Render deployments and container recycling
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  if (server) {
    server.close(() => {
      console.log("HTTP server closed.");
    });
  }
  await disconnectDB();
  console.log("Graceful shutdown completed successfully. Exiting.");
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});
