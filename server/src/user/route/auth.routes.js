import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
} from "../service/auth.service.js";
import rateLimit from "express-rate-limit";
import { protect } from "../../middleware/auth.middleware.js";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many login attempts, try again in 15 min.",
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

// POST /api/auth/register
router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const newUser = await registerUser(email, password);

    res.status(201).json({
      message: "User created successfully",
      userId: newUser._id,
      email: newUser.email,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const token = await loginUser(email, password);

    res.json({ token });
  } catch (err) {
    next(err);
  }
});

//GET /api/auth/me
router.get("/me", protect, async (req, res, next) => {
  try {
    const userProfile = await getUserProfile(req.user.id);

    res.json(userProfile);
  } catch (err) {
    next(err);
  }
});

export default router;
