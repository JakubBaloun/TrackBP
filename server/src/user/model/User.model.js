import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      enum: ["polar"],
    },
    accessToken: { type: String, required: true },
    expiresAt: { type: Date },
    providerUserId: { type: String },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, "password is required"],
    },
    connections: [connectionSchema],
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);
export default User;
