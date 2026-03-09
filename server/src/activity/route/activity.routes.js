import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import {
  syncPolarActivities,
  getUserActivities,
  getActivityById,
  deleteActivity,
  updateActivity,
  getActivityStats,
} from "../service/activity.service.js";

const router = express.Router();

// POST /api/activities/sync
router.post("/sync", protect, async (req, res, next) => {
  try {
    const result = await syncPolarActivities(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/activities
router.get("/", protect, async (req, res, next) => {
  try {
    const filters = {
      limit: req.query.limit,
      offset: req.query.offset,
      sport: req.query.sport,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    };

    const activities = await getUserActivities(req.user.id, filters);
    res.json(activities);
  } catch (err) {
    next(err);
  }
});

// GET /api/activities/stats
router.get("/stats", protect, async (req, res, next) => {
  try {
    const stats = await getActivityStats(req.user.id);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// GET /api/activities/:id
router.get("/:id", protect, async (req, res, next) => {
  try {
    const activity = await getActivityById(req.params.id, req.user.id);
    res.json(activity);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/activity/:id
router.delete("/:id", protect, async (req, res, next) => {
  try {
    await deleteActivity(req.params.id, req.user.id);
    res.json({ message: "Activity deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// PUT /api/activity/:id
router.put("/:id", protect, async (req, res, next) => {
  try {
    const updatedActivity = await updateActivity(
      req.params.id,
      req.user.id,
      req.body,
    );
    res.json(updatedActivity);
  } catch (err) {
    next(err);
  }
});

export default router;
