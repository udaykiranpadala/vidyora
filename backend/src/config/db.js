import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    // Sized conservatively for Render Free tier (512MB RAM).
    // Prevents socket buffer bloat and connection exhaustion while supporting high async I/O.
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
    });
    isConnected = true;
    console.log("✅ MongoDB connected (Production Pool Optimized: min 2, max 10)");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  if (isConnected) {
    try {
      await mongoose.connection.close(false);
      isConnected = false;
      console.log("MongoDB connection closed cleanly.");
    } catch (err) {
      console.error("Error closing MongoDB connection:", err.message);
    }
  }
};

export default connectDB;
