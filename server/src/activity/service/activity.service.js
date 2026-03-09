import { NotFoundError, IntegrationError, AppError } from "../../lib/errors.js";
import Activity from "../model/Activity.model.js";
import { getPolarExercises } from "../../integration/service/polar.service.js";
import mongoose from "mongoose";
import {
  parseIsoDuration,
  parseSamples,
  parseRoute,
  parseZones,
} from "../../lib/polar.utils.js";

/**
 * Syncs excersises from polar API and saves new activities to DB.
 */
export const syncPolarActivities = async (userId) => {
  console.log(`[Sync] Fetching Polar data for user ${userId}...`);

  let polarExercises = [];

  try {
    polarExercises = await getPolarExercises(userId);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("[Sync] Polar API failed:", error.message);
    throw new IntegrationError(
      `Failed to communicate with Polar: ${error.message}`,
    );
  }

  if (!polarExercises || polarExercises.length === 0) {
    return {
      syncedCount: 0,
      failedCount: 0,
      message: "No exercises found on Polar.",
    };
  }

  const existingActivities = await Activity.find({
    userId,
    provider: "polar",
    externalId: { $in: polarExercises.map((e) => e.id) },
  }).select("externalId");

  const existingIds = new Set(existingActivities.map((a) => a.externalId));

  let syncedCount = 0;
  let failedCount = 0;
  const errors = [];

  for (const exercise of polarExercises) {
    if (existingIds.has(exercise.id)) {
      continue;
    }

    try {
      const newActivity = new Activity({
        userId,
        provider: "polar",
        externalId: exercise.id,

        sport: exercise.sport,
        detailedSport: exercise.detailed_sport_info,
        startTime: new Date(exercise.start_time),
        timezoneOffset: exercise.start_time_utc_offset,
        duration: parseIsoDuration(exercise.duration),

        stats: {
          calories: exercise.calories,
          distance: exercise.distance || 0,
          avgHeartRate: exercise.heart_rate?.average,
          maxHeartRate: exercise.heart_rate?.maximum,
          fatPercentage: exercise.fat_percentage,
          carbohydratePercentage: exercise.carbohydrate_percentage,
          proteinPercentage: exercise.protein_percentage,
        },

        load: {
          value: exercise.training_load_pro?.["cardio-load"],
          interpretation:
            exercise.training_load_pro?.["cardio-load-interpretation"],
        },

        samples: {
          heartRate: parseSamples(exercise.samples, 0),
          speed: parseSamples(exercise.samples, 1),
          cadence: parseSamples(exercise.samples, 10),
        },
        zones: parseZones(exercise.heart_rate_zones),
        route: exercise.has_route ? parseRoute(exercise.route) : undefined,
        originalData: exercise,
      });

      await newActivity.save();
      syncedCount++;
    } catch (err) {
      failedCount++;
      console.error(
        `[Sync] Failed to save activity ${exercise.id}:`,
        err.message,
      );
      errors.push({ id: exercise.id, error: err.message });
    }
  }

  console.log(`[Sync] Finished. Saved: ${syncedCount}, Failed: ${failedCount}`);

  return {
    syncedCount,
    failedCount,
    totalFetched: polarExercises.length,
    message: `Sync complete. Saved: ${syncedCount}, Failed: ${failedCount}.`,
    errors: errors.length > 0 ? errors : undefined, // Vrátíme detaily chyb jen pokud nějaké jsou
  };
};

export const getUserActivities = async (userId, filters = {}) => {
  const { limit = 20, sport, dateFrom, dateTo } = filters;

  const query = { userId, isDeleted: false };

  if (sport) {
    query.sport = sport;
  }

  if (dateFrom || dateTo) {
    query.startTime = {};
    if (dateFrom) query.startTime.$gte = new Date(dateFrom);
    if (dateTo) query.startTime.$lte = new Date(dateTo);
  }

  const activities = await Activity.find(query)
    .sort({ startTime: -1 })
    .limit(parseInt(limit));

  return activities;
};

export const getActivityById = async (activityId, userId) => {
  const activity = await Activity.findOne({
    _id: activityId,
    userId,
    isDeleted: false,
  }).select(
    "+samples.heartRate +samples.speed +samples.cadence +zones +route.coordinates",
  );

  if (!activity) {
    throw new NotFoundError("Activity not found");
  }

  return activity;
};

export const deleteActivity = async (activityId, userId) => {
  const deletedActivity = await Activity.findOneAndUpdate(
    { _id: activityId, userId },
    { isDeleted: true }, // <--- Změna
    { new: true },
  );

  if (!deletedActivity) {
    throw new NotFoundError("Activity not found or not authorized");
  }

  return deletedActivity;
};

export const updateActivity = async (activityId, userId, updateData) => {
  const allowedUpdates = {
    ...(updateData.title && { title: updateData.title }),
    ...(updateData.description !== undefined && {
      description: updateData.description,
    }),
  };

  // Validate feeling range (1-5, or -1 for unset)
  if (updateData.feeling !== undefined) {
    const feeling = Number(updateData.feeling);
    if (feeling === -1 || (feeling >= 1 && feeling <= 5)) {
      allowedUpdates.feeling = feeling;
    }
  }

  const updatedActivity = await Activity.findOneAndUpdate(
    { _id: activityId, userId },
    { $set: allowedUpdates },
    { new: true },
  ).select(
    "+samples.heartRate +samples.speed +samples.cadence +zones +route.coordinates",
  );

  if (!updatedActivity) {
    throw new NotFoundError("Activity not found");
  }

  return updatedActivity;
};

export const getActivityStats = async (userId) => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const stats = await Activity.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
      },
    },

    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalActivities: { $sum: 1 },
              totalDuration: { $sum: "$duration" },
              totalDistance: { $sum: "$stats.distance" },
              totalCalories: { $sum: "$stats.calories" },
            },
          },
        ],

        thisMonth: [
          { $match: { startTime: { $gte: firstDayOfMonth } } },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              distance: { $sum: "$stats.distance" },
              duration: { $sum: "$duration" },
              calories: { $sum: "$stats.calories" },
            },
          },
        ],

        sportsDistribution: [
          {
            $group: {
              _id: { $ifNull: ["$detailedSport", "$sport"] },
              count: { $sum: 1 },
              distance: { $sum: "$stats.distance" },
              duration: { $sum: "$duration" },
            },
          },
          { $sort: { count: -1 } },
        ],

        recentTrend: [
          { $match: { startTime: { $gte: oneMonthAgo } } },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$startTime" },
              },
              dailyCalories: { $sum: "$stats.calories" },
              dailyDistance: { $sum: "$stats.distance" },
              dailyDuration: { $sum: "$duration" },
              activitiesCount: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ]);

  const result = stats[0];

  return {
    totals: result.totals[0] || {
      totalActivities: 0,
      totalDuration: 0,
      totalDistance: 0,
      totalCalories: 0,
    },
    thisMonth: result.thisMonth[0] || {
      count: 0,
      distance: 0,
      duration: 0,
      calories: 0,
    },
    sportsDistribution: result.sportsDistribution,
    recentTrend: result.recentTrend,
  };
};
