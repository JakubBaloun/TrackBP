import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import Activity from "../../../src/activity/model/Activity.model.js";
import User from "../../../src/user/model/User.model.js";
import { NotFoundError, UnauthorizedError } from "../../../src/lib/errors.js";

// Mock polar service before importing activity service
const mockGetPolarExercises = jest.fn();

jest.unstable_mockModule("../../../src/integration/service/polar.service.js", () => ({
  getPolarExercises: mockGetPolarExercises,
}));

// Import after mocking
const { syncPolarActivities, getUserActivities, getActivityById, deleteActivity, updateActivity, getActivityStats } = await import("../../../src/activity/service/activity.service.js");

describe("Activity Service", () => {
  let testUser;

  beforeEach(async () => {
    jest.clearAllMocks();

    testUser = await new User({
      email: "test@example.com",
      passwordHash: "hashedpassword123",
    }).save();
  });

  describe("syncPolarActivities", () => {
    const mockPolarExercises = [
      {
        id: "polar-ex-1",
        sport: "RUNNING",
        detailed_sport_info: "Trail Running",
        start_time: "2024-01-15T10:00:00.000Z",
        start_time_utc_offset: 60,
        duration: "PT1H30M",
        calories: 500,
        distance: 15000,
        heart_rate: { average: 145, maximum: 175 },
        has_route: false,
      },
      {
        id: "polar-ex-2",
        sport: "CYCLING",
        start_time: "2024-01-16T14:00:00.000Z",
        duration: "PT2H",
        calories: 800,
        distance: 50000,
        has_route: true,
        route: [
          { latitude: 50.0, longitude: 14.0 },
          { latitude: 50.1, longitude: 14.1 },
        ],
      },
    ];

    it("should sync new exercises from Polar", async () => {
      mockGetPolarExercises.mockResolvedValue(mockPolarExercises);

      const result = await syncPolarActivities(testUser._id);

      expect(result.syncedCount).toBe(2);
      expect(result.failedCount).toBe(0);
      expect(result.totalFetched).toBe(2);

      const activities = await Activity.find({ userId: testUser._id });
      expect(activities).toHaveLength(2);
    });

    it("should skip already synced exercises", async () => {
      await new Activity({
        userId: testUser._id,
        provider: "polar",
        externalId: "polar-ex-1",
        startTime: new Date(),
        duration: 5400,
      }).save();

      mockGetPolarExercises.mockResolvedValue(mockPolarExercises);

      const result = await syncPolarActivities(testUser._id);

      expect(result.syncedCount).toBe(1);
      expect(result.totalFetched).toBe(2);

      const activities = await Activity.find({ userId: testUser._id });
      expect(activities).toHaveLength(2);
    });

    it("should return zero counts when no exercises found", async () => {
      mockGetPolarExercises.mockResolvedValue([]);

      const result = await syncPolarActivities(testUser._id);

      expect(result.syncedCount).toBe(0);
      expect(result.message).toContain("No exercises found");
    });

    it("should handle null response from Polar", async () => {
      mockGetPolarExercises.mockResolvedValue(null);

      const result = await syncPolarActivities(testUser._id);

      expect(result.syncedCount).toBe(0);
    });

    it("should propagate UnauthorizedError from polar service", async () => {
      mockGetPolarExercises.mockRejectedValue(
        new UnauthorizedError("Polar account not connected")
      );

      await expect(syncPolarActivities(testUser._id)).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  describe("getUserActivities", () => {
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
        {
          userId: testUser._id,
          provider: "polar",
          externalId: "act-3",
          sport: "RUNNING",
          startTime: new Date("2024-01-17"),
          duration: 1800,
          isDeleted: true,
        },
      ]);
    });

    it("should return user activities sorted by startTime desc", async () => {
      const activities = await getUserActivities(testUser._id);

      expect(activities).toHaveLength(2);
      expect(activities[0].externalId).toBe("act-2");
      expect(activities[1].externalId).toBe("act-1");
    });

    it("should exclude deleted activities", async () => {
      const activities = await getUserActivities(testUser._id);

      expect(activities).toHaveLength(2);
      expect(activities.find((a) => a.externalId === "act-3")).toBeUndefined();
    });

    it("should filter by sport", async () => {
      const activities = await getUserActivities(testUser._id, {
        sport: "RUNNING",
      });

      expect(activities).toHaveLength(1);
      expect(activities[0].sport).toBe("RUNNING");
    });

    it("should filter by date range", async () => {
      const activities = await getUserActivities(testUser._id, {
        dateFrom: "2024-01-16",
        dateTo: "2024-01-17",
      });

      expect(activities).toHaveLength(1);
      expect(activities[0].externalId).toBe("act-2");
    });

    it("should respect limit parameter", async () => {
      const activities = await getUserActivities(testUser._id, { limit: 1 });

      expect(activities).toHaveLength(1);
    });
  });

  describe("getActivityById", () => {
    let testActivity;

    beforeEach(async () => {
      testActivity = await new Activity({
        userId: testUser._id,
        provider: "polar",
        externalId: "act-detail",
        startTime: new Date(),
        duration: 3600,
        samples: {
          heartRate: [120, 130, 140],
          speed: [2.5, 2.6, 2.7],
        },
        zones: [{ index: 1, lowerLimit: 100, upperLimit: 120, duration: 600 }],
      }).save();
    });

    it("should return activity with hidden fields", async () => {
      const activity = await getActivityById(testActivity._id, testUser._id);

      expect(activity._id.toString()).toBe(testActivity._id.toString());
      expect(activity.samples.heartRate).toEqual([120, 130, 140]);
      expect(activity.samples.speed).toEqual([2.5, 2.6, 2.7]);
      expect(activity.zones).toHaveLength(1);
    });

    it("should throw NotFoundError for non-existent activity", async () => {
      const fakeId = "507f1f77bcf86cd799439011";

      await expect(getActivityById(fakeId, testUser._id)).rejects.toThrow(
        NotFoundError
      );
    });

    it("should throw NotFoundError for deleted activity", async () => {
      testActivity.isDeleted = true;
      await testActivity.save();

      await expect(
        getActivityById(testActivity._id, testUser._id)
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError for activity belonging to another user", async () => {
      const anotherUser = await new User({
        email: "another@example.com",
        passwordHash: "hash",
      }).save();

      await expect(
        getActivityById(testActivity._id, anotherUser._id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteActivity", () => {
    let testActivity;

    beforeEach(async () => {
      testActivity = await new Activity({
        userId: testUser._id,
        provider: "polar",
        externalId: "act-delete",
        startTime: new Date(),
        duration: 3600,
      }).save();
    });

    it("should soft delete activity", async () => {
      const result = await deleteActivity(testActivity._id, testUser._id);

      expect(result.isDeleted).toBe(true);

      const found = await Activity.findById(testActivity._id);
      expect(found.isDeleted).toBe(true);
    });

    it("should throw NotFoundError for non-existent activity", async () => {
      const fakeId = "507f1f77bcf86cd799439011";

      await expect(deleteActivity(fakeId, testUser._id)).rejects.toThrow(
        NotFoundError
      );
    });

    it("should throw NotFoundError for activity belonging to another user", async () => {
      const anotherUser = await new User({
        email: "another@example.com",
        passwordHash: "hash",
      }).save();

      await expect(
        deleteActivity(testActivity._id, anotherUser._id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateActivity", () => {
    let testActivity;

    beforeEach(async () => {
      testActivity = await new Activity({
        userId: testUser._id,
        provider: "polar",
        externalId: "act-update",
        startTime: new Date(),
        duration: 3600,
        title: "Original Title",
      }).save();
    });

    it("should update allowed fields", async () => {
      const result = await updateActivity(testActivity._id, testUser._id, {
        title: "New Title",
        description: "New description",
        feeling: 4,
      });

      expect(result.title).toBe("New Title");
      expect(result.description).toBe("New description");
      expect(result.feeling).toBe(4);
    });

    it("should ignore non-allowed fields", async () => {
      const originalDuration = testActivity.duration;

      const result = await updateActivity(testActivity._id, testUser._id, {
        title: "New Title",
        duration: 9999,
        provider: "other",
      });

      expect(result.title).toBe("New Title");
      expect(result.duration).toBe(originalDuration);
      expect(result.provider).toBe("polar");
    });

    it("should throw NotFoundError for non-existent activity", async () => {
      const fakeId = "507f1f77bcf86cd799439011";

      await expect(
        updateActivity(fakeId, testUser._id, { title: "Test" })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getActivityStats", () => {
    beforeEach(async () => {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);

      await Activity.create([
        {
          userId: testUser._id,
          provider: "polar",
          externalId: "stat-1",
          sport: "RUNNING",
          detailedSport: "Trail Running",
          startTime: thisMonth,
          duration: 3600,
          stats: { calories: 500, distance: 10000 },
        },
        {
          userId: testUser._id,
          provider: "polar",
          externalId: "stat-2",
          sport: "CYCLING",
          startTime: thisMonth,
          duration: 7200,
          stats: { calories: 800, distance: 50000 },
        },
        {
          userId: testUser._id,
          provider: "polar",
          externalId: "stat-3",
          sport: "RUNNING",
          startTime: lastMonth,
          duration: 1800,
          stats: { calories: 250, distance: 5000 },
        },
      ]);
    });

    it("should return aggregated stats", async () => {
      const stats = await getActivityStats(testUser._id);

      expect(stats.totals.totalActivities).toBe(3);
      expect(stats.totals.totalDuration).toBe(12600);
      expect(stats.totals.totalDistance).toBe(65000);
      expect(stats.totals.totalCalories).toBe(1550);
    });

    it("should return this month stats", async () => {
      const stats = await getActivityStats(testUser._id);

      expect(stats.thisMonth.count).toBe(2);
      expect(stats.thisMonth.distance).toBe(60000);
    });

    it("should return sports distribution", async () => {
      const stats = await getActivityStats(testUser._id);

      expect(stats.sportsDistribution).toHaveLength(3);
      const running = stats.sportsDistribution.find(
        (s) => s._id === "Trail Running"
      );
      expect(running).toBeDefined();
    });

    it("should return empty stats for user with no activities", async () => {
      const newUser = await new User({
        email: "new@example.com",
        passwordHash: "hash",
      }).save();

      const stats = await getActivityStats(newUser._id);

      expect(stats.totals.totalActivities).toBe(0);
      expect(stats.thisMonth.count).toBe(0);
      expect(stats.sportsDistribution).toHaveLength(0);
    });
  });
});
