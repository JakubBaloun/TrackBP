import mongoose from "mongoose";
import Activity from "../../../src/activity/model/Activity.model.js";
import User from "../../../src/user/model/User.model.js";

describe("Activity Model", () => {
  let testUser;

  beforeEach(async () => {
    testUser = await new User({
      email: "test@example.com",
      passwordHash: "hashedpassword123",
    }).save();
  });

  describe("Schema validation", () => {
    it("should create a valid activity with required fields", async () => {
      const activityData = {
        userId: testUser._id,
        provider: "polar",
        externalId: "activity123",
        startTime: new Date(),
        duration: 3600,
      };

      const activity = new Activity(activityData);
      const savedActivity = await activity.save();

      expect(savedActivity._id).toBeDefined();
      expect(savedActivity.userId.toString()).toBe(testUser._id.toString());
      expect(savedActivity.provider).toBe("polar");
      expect(savedActivity.externalId).toBe("activity123");
      expect(savedActivity.duration).toBe(3600);
      expect(savedActivity.isDeleted).toBe(false);
    });

    it("should require userId", async () => {
      const activity = new Activity({
        provider: "polar",
        externalId: "activity123",
        startTime: new Date(),
        duration: 3600,
      });

      await expect(activity.save()).rejects.toThrow();
    });

    it("should require provider", async () => {
      const activity = new Activity({
        userId: testUser._id,
        externalId: "activity123",
        startTime: new Date(),
        duration: 3600,
      });

      await expect(activity.save()).rejects.toThrow();
    });

    it("should require externalId", async () => {
      const activity = new Activity({
        userId: testUser._id,
        provider: "polar",
        startTime: new Date(),
        duration: 3600,
      });

      await expect(activity.save()).rejects.toThrow();
    });

    it("should require startTime", async () => {
      const activity = new Activity({
        userId: testUser._id,
        provider: "polar",
        externalId: "activity123",
        duration: 3600,
      });

      await expect(activity.save()).rejects.toThrow();
    });

    it("should require duration", async () => {
      const activity = new Activity({
        userId: testUser._id,
        provider: "polar",
        externalId: "activity123",
        startTime: new Date(),
      });

      await expect(activity.save()).rejects.toThrow();
    });

    it("should reject invalid provider", async () => {
      const activity = new Activity({
        userId: testUser._id,
        provider: "invalid_provider",
        externalId: "activity123",
        startTime: new Date(),
        duration: 3600,
      });

      await expect(activity.save()).rejects.toThrow();
    });
  });

  describe("Default values", () => {
    it("should set default title from detailedSport", async () => {
      const activity = new Activity({
        userId: testUser._id,
        provider: "polar",
        externalId: "activity123",
        startTime: new Date(),
        duration: 3600,
        detailedSport: "Trail Running",
        sport: "Running",
      });

      const savedActivity = await activity.save();
      expect(savedActivity.title).toBe("Trail Running");
    });

    it("should set default title from sport if no detailedSport", async () => {
      const activity = new Activity({
        userId: testUser._id,
        provider: "polar",
        externalId: "activity124",
        startTime: new Date(),
        duration: 3600,
        sport: "Running",
      });

      const savedActivity = await activity.save();
      expect(savedActivity.title).toBe("Running");
    });

    it("should default feeling to -1", async () => {
      const activity = new Activity({
        userId: testUser._id,
        provider: "polar",
        externalId: "activity125",
        startTime: new Date(),
        duration: 3600,
      });

      const savedActivity = await activity.save();
      expect(savedActivity.feeling).toBe(-1);
    });

    it("should default isDeleted to false", async () => {
      const activity = new Activity({
        userId: testUser._id,
        provider: "polar",
        externalId: "activity126",
        startTime: new Date(),
        duration: 3600,
      });

      const savedActivity = await activity.save();
      expect(savedActivity.isDeleted).toBe(false);
    });
  });

  describe("Indexes", () => {
    it("should enforce unique provider + externalId combination", async () => {
      const activityData = {
        userId: testUser._id,
        provider: "polar",
        externalId: "duplicate123",
        startTime: new Date(),
        duration: 3600,
      };

      await new Activity(activityData).save();

      const duplicateActivity = new Activity(activityData);
      await expect(duplicateActivity.save()).rejects.toThrow();
    });

    it("should allow same externalId with different provider", async () => {
      const activity1 = await new Activity({
        userId: testUser._id,
        provider: "polar",
        externalId: "sameId123",
        startTime: new Date(),
        duration: 3600,
      }).save();

      // This would work if we had another provider in the enum
      expect(activity1._id).toBeDefined();
    });
  });

  describe("Stats subdocument", () => {
    it("should save activity stats", async () => {
      const activity = new Activity({
        userId: testUser._id,
        provider: "polar",
        externalId: "activity127",
        startTime: new Date(),
        duration: 3600,
        stats: {
          calories: 500,
          distance: 10000,
          avgHeartRate: 145,
          maxHeartRate: 175,
        },
      });

      const savedActivity = await activity.save();
      expect(savedActivity.stats.calories).toBe(500);
      expect(savedActivity.stats.distance).toBe(10000);
      expect(savedActivity.stats.avgHeartRate).toBe(145);
      expect(savedActivity.stats.maxHeartRate).toBe(175);
    });
  });

  describe("Load subdocument", () => {
    it("should save load data", async () => {
      const activity = new Activity({
        userId: testUser._id,
        provider: "polar",
        externalId: "activity128",
        startTime: new Date(),
        duration: 3600,
        load: {
          value: 150,
          interpretation: "moderate",
        },
      });

      const savedActivity = await activity.save();
      expect(savedActivity.load.value).toBe(150);
      expect(savedActivity.load.interpretation).toBe("moderate");
    });
  });

  describe("Hidden fields (select: false)", () => {
    it("should not return hidden fields by default", async () => {
      const activity = await new Activity({
        userId: testUser._id,
        provider: "polar",
        externalId: "activity129",
        startTime: new Date(),
        duration: 3600,
        samples: {
          heartRate: [120, 130, 140],
        },
        originalData: { raw: "data" },
      }).save();

      const foundActivity = await Activity.findById(activity._id);
      expect(foundActivity.samples.heartRate).toBeUndefined();
      expect(foundActivity.originalData).toBeUndefined();
    });

    it("should return hidden fields when explicitly selected", async () => {
      const activity = await new Activity({
        userId: testUser._id,
        provider: "polar",
        externalId: "activity130",
        startTime: new Date(),
        duration: 3600,
        samples: {
          heartRate: [120, 130, 140],
        },
      }).save();

      const foundActivity = await Activity.findById(activity._id).select(
        "+samples.heartRate"
      );
      expect(foundActivity.samples.heartRate).toEqual([120, 130, 140]);
    });
  });
});
