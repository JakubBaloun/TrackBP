import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import express from "express";
import request from "supertest";
import { registerUser } from "../../src/user/service/auth.service.js";
import Activity from "../../src/activity/model/Activity.model.js";
import jwt from "jsonwebtoken";

// Mock polar service before importing routes
const mockGetPolarExercises = jest.fn();

jest.unstable_mockModule("../../src/integration/service/polar.service.js", () => ({
  getPolarExercises: mockGetPolarExercises,
}));

// Import routes after mocking
const activityRoutes = (await import("../../src/activity/route/activity.routes.js")).default;

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/activities", activityRoutes);

  app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({
      error: err.name || "ServerError",
      message: err.message || "Internal Server Error",
    });
  });

  return app;
}

describe("Activity Routes", () => {
  const app = createTestApp();
  let authToken;
  let testUser;

  beforeEach(async () => {
    jest.clearAllMocks();

    testUser = await registerUser("activity@example.com", "ValidPass123");
    authToken = jwt.sign(
      { id: testUser._id, email: testUser.email },
      process.env.JWT_SECRET
    );
  });

  describe("POST /api/activities/sync", () => {
    it("should sync activities from Polar", async () => {
      mockGetPolarExercises.mockResolvedValue([
        {
          id: "polar-1",
          sport: "RUNNING",
          start_time: "2024-01-15T10:00:00.000Z",
          duration: "PT1H",
          calories: 500,
        },
      ]);

      const res = await request(app)
        .post("/api/activities/sync")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.syncedCount).toBe(1);

      const activities = await Activity.find({ userId: testUser._id });
      expect(activities).toHaveLength(1);
    });

    it("should return zero when no exercises found", async () => {
      mockGetPolarExercises.mockResolvedValue([]);

      const res = await request(app)
        .post("/api/activities/sync")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.syncedCount).toBe(0);
    });

    it("should return 401 without authorization", async () => {
      const res = await request(app).post("/api/activities/sync");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/activities", () => {
    beforeEach(async () => {
      await Activity.create([
        {
          userId: testUser._id,
          provider: "polar",
          externalId: "act-1",
          sport: "RUNNING",
          startTime: new Date("2024-01-15"),
          duration: 3600,
        },
        {
          userId: testUser._id,
          provider: "polar",
          externalId: "act-2",
          sport: "CYCLING",
          startTime: new Date("2024-01-16"),
          duration: 7200,
        },
      ]);
    });

    it("should return list of activities", async () => {
      const res = await request(app)
        .get("/api/activities")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.activities).toHaveLength(2);
      expect(res.body.total).toBe(2);
      expect(res.body.activities[0].externalId).toBe("act-2"); // sorted by startTime desc
    });

    it("should filter by sport", async () => {
      const res = await request(app)
        .get("/api/activities")
        .query({ sport: "RUNNING" })
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.activities).toHaveLength(1);
      expect(res.body.activities[0].sport).toBe("RUNNING");
    });

    it("should filter by date range", async () => {
      const res = await request(app)
        .get("/api/activities")
        .query({ dateFrom: "2024-01-16" })
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.activities).toHaveLength(1);
    });

    it("should respect limit parameter", async () => {
      const res = await request(app)
        .get("/api/activities")
        .query({ limit: 1 })
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.activities).toHaveLength(1);
      expect(res.body.total).toBe(2);
    });

    it("should support offset parameter", async () => {
      const res = await request(app)
        .get("/api/activities")
        .query({ limit: 1, offset: 1 })
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.activities).toHaveLength(1);
      expect(res.body.activities[0].externalId).toBe("act-1");
      expect(res.body.offset).toBe(1);
    });

    it("should return 401 without authorization", async () => {
      const res = await request(app).get("/api/activities");

      expect(res.status).toBe(401);
    });

    it("should not return activities from other users", async () => {
      const otherUser = await registerUser("other@example.com", "ValidPass123");
      await Activity.create({
        userId: otherUser._id,
        provider: "polar",
        externalId: "other-act",
        startTime: new Date(),
        duration: 1800,
      });

      const res = await request(app)
        .get("/api/activities")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.activities).toHaveLength(2);
      expect(res.body.activities.find((a) => a.externalId === "other-act")).toBeUndefined();
    });
  });

  describe("GET /api/activities/stats", () => {
    beforeEach(async () => {
      const now = new Date();
      await Activity.create([
        {
          userId: testUser._id,
          provider: "polar",
          externalId: "stat-1",
          sport: "RUNNING",
          startTime: now,
          duration: 3600,
          stats: { calories: 500, distance: 10000 },
        },
        {
          userId: testUser._id,
          provider: "polar",
          externalId: "stat-2",
          sport: "CYCLING",
          startTime: now,
          duration: 7200,
          stats: { calories: 800, distance: 50000 },
        },
      ]);
    });

    it("should return activity statistics", async () => {
      const res = await request(app)
        .get("/api/activities/stats")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totals.totalActivities).toBe(2);
      expect(res.body.totals.totalDistance).toBe(60000);
      expect(res.body.totals.totalCalories).toBe(1300);
      expect(res.body.sportsDistribution).toBeDefined();
    });

    it("should return 401 without authorization", async () => {
      const res = await request(app).get("/api/activities/stats");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/activities/:id", () => {
    let testActivity;

    beforeEach(async () => {
      testActivity = await Activity.create({
        userId: testUser._id,
        provider: "polar",
        externalId: "detail-act",
        startTime: new Date(),
        duration: 3600,
        samples: {
          heartRate: [120, 130, 140],
          speed: [2.5, 2.6, 2.7],
        },
        zones: [{ index: 1, lowerLimit: 100, upperLimit: 120, duration: 600 }],
      });
    });

    it("should return activity with hidden fields", async () => {
      const res = await request(app)
        .get(`/api/activities/${testActivity._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.externalId).toBe("detail-act");
      expect(res.body.samples.heartRate).toEqual([120, 130, 140]);
      expect(res.body.zones).toHaveLength(1);
    });

    it("should return 404 for non-existent activity", async () => {
      const fakeId = "507f1f77bcf86cd799439011";

      const res = await request(app)
        .get(`/api/activities/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 for activity belonging to another user", async () => {
      const otherUser = await registerUser("other2@example.com", "ValidPass123");
      const otherToken = jwt.sign(
        { id: otherUser._id, email: otherUser.email },
        process.env.JWT_SECRET
      );

      const res = await request(app)
        .get(`/api/activities/${testActivity._id}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 401 without authorization", async () => {
      const res = await request(app).get(`/api/activities/${testActivity._id}`);

      expect(res.status).toBe(401);
    });
  });

  describe("PUT /api/activities/:id", () => {
    let testActivity;

    beforeEach(async () => {
      testActivity = await Activity.create({
        userId: testUser._id,
        provider: "polar",
        externalId: "update-act",
        startTime: new Date(),
        duration: 3600,
        title: "Original Title",
      });
    });

    it("should update activity fields", async () => {
      const res = await request(app)
        .put(`/api/activities/${testActivity._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Updated Title",
          description: "New description",
          feeling: 5,
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Updated Title");
      expect(res.body.description).toBe("New description");
      expect(res.body.feeling).toBe(5);
    });

    it("should not update protected fields", async () => {
      const res = await request(app)
        .put(`/api/activities/${testActivity._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Updated Title",
          duration: 9999,
          provider: "other",
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Updated Title");
      expect(res.body.duration).toBe(3600);
      expect(res.body.provider).toBe("polar");
    });

    it("should validate feeling range (1-5)", async () => {
      const res = await request(app)
        .put(`/api/activities/${testActivity._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ feeling: 10 });

      expect(res.status).toBe(200);
      expect(res.body.feeling).toBe(-1); // should not update invalid value
    });

    it("should allow feeling value -1 (unset)", async () => {
      // First set feeling to 5
      await request(app)
        .put(`/api/activities/${testActivity._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ feeling: 5 });

      // Then reset to -1
      const res = await request(app)
        .put(`/api/activities/${testActivity._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ feeling: -1 });

      expect(res.status).toBe(200);
      expect(res.body.feeling).toBe(-1);
    });

    it("should accept valid feeling values 1-5", async () => {
      for (const feeling of [1, 2, 3, 4, 5]) {
        const res = await request(app)
          .put(`/api/activities/${testActivity._id}`)
          .set("Authorization", `Bearer ${authToken}`)
          .send({ feeling });

        expect(res.status).toBe(200);
        expect(res.body.feeling).toBe(feeling);
      }
    });

    it("should return 404 for non-existent activity", async () => {
      const fakeId = "507f1f77bcf86cd799439011";

      const res = await request(app)
        .put(`/api/activities/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Test" });

      expect(res.status).toBe(404);
    });

    it("should return 401 without authorization", async () => {
      const res = await request(app)
        .put(`/api/activities/${testActivity._id}`)
        .send({ title: "Test" });

      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /api/activities/:id", () => {
    let testActivity;

    beforeEach(async () => {
      testActivity = await Activity.create({
        userId: testUser._id,
        provider: "polar",
        externalId: "delete-act",
        startTime: new Date(),
        duration: 3600,
      });
    });

    it("should soft delete activity", async () => {
      const res = await request(app)
        .delete(`/api/activities/${testActivity._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("deleted");

      const found = await Activity.findById(testActivity._id);
      expect(found.isDeleted).toBe(true);
    });

    it("should return 404 for non-existent activity", async () => {
      const fakeId = "507f1f77bcf86cd799439011";

      const res = await request(app)
        .delete(`/api/activities/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 404 for activity belonging to another user", async () => {
      const otherUser = await registerUser("other3@example.com", "ValidPass123");
      const otherToken = jwt.sign(
        { id: otherUser._id, email: otherUser.email },
        process.env.JWT_SECRET
      );

      const res = await request(app)
        .delete(`/api/activities/${testActivity._id}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 401 without authorization", async () => {
      const res = await request(app).delete(
        `/api/activities/${testActivity._id}`
      );

      expect(res.status).toBe(401);
    });
  });
});
