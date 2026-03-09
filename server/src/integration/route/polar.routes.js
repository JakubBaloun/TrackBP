import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import {
  getPolarAuthUrl,
  handlePolarCallback,
  getPolarConnectionStatus,
  getPolarExercises,
  getPolarExerciseById,
} from "../service/polar.service.js";
import { BadRequestError } from "../../lib/errors.js";

const router = express.Router();

router.get("/polar/connect", protect, async (req, res, next) => {
  try {
    const { authorizationUrl } = await getPolarAuthUrl(req.user.id);
    res.json({ authorizationUrl });
  } catch (err) {
    next(err);
  }
});

router.get("/polar/callback", async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      throw new BadRequestError(`Polar callback error: ${error}`);
    }
    if (!state) {
      throw new BadRequestError("Missing state parameter");
    }
    if (!code) {
      throw new BadRequestError("Polar callback error: No code provided");
    }

    const userId = state;
    await handlePolarCallback(code, userId);

    const redirectUrl =
      process.env.FRONTEND_DASHBOARD_URL || "http://localhost:5173/dashboard";

    res.redirect(redirectUrl);
  } catch (err) {
    next(err);
  }
});

router.get("/polar/status", protect, async (req, res, next) => {
  try {
    const connectionStatus = await getPolarConnectionStatus(req.user.id);
    res.json(connectionStatus);
  } catch (err) {
    next(err);
  }
});

router.get("/polar/exercises", protect, async (req, res, next) => {
  try {
    const exercises = await getPolarExercises(req.user.id);
    res.json(exercises);
  } catch (err) {
    next(err);
  }
});

router.get("/polar/exercise/:id", protect, async (req, res, next) => {
  try {
    const exerciseId = req.params.id;
    const exerciseData = await getPolarExerciseById(req.user.id, exerciseId);

    res.json(exerciseData);
  } catch (err) {
    next(err);
  }
});

export default router;
