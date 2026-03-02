import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("Missing MONGODB_URI in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to database");
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1);
  }
}

export async function disconnectDB() {
  await mongoose.connection.close();
  console.log("Database connection closed");
}
