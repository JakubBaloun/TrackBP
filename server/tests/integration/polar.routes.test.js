import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import express from "express";
import request from "supertest";
import { registerUser } from "../../src/user/service/auth.service.js";
import User from "../../src/user/model/User.model.js";
import jwt from "jsonwebtoken";

// Mock axios before importing routes
const mockAxios = {
  get: jest.fn(),
  post: jest.fn(),
};

jest.unstable_mockModule("axios", () => ({
  default: mockAxios,
}));

// Import routes after mocking
const polarRoutes = (await import("../../src/integration/route/polar.routes.js")).default;

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", polarRoutes);

  app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({
      error: err.name || "ServerError",
      message: err.message || "Internal Server Error",
    });
  });

  return app;
}

describe("Polar Routes", () => {
  const app = createTestApp();
  let authToken;
  let testUser;

  beforeEach(async () => {
    jest.clearAllMocks();

    process.env.POLAR_CLIENT_ID = "test-client-id";
    process.env.POLAR_CLIENT_SECRET = "test-client-secret";
    process.env.POLAR_REDIRECT_URI = "http://localhost:3000/api/polar/callback";

    testUser = await registerUser("polar@example.com", "ValidPass123");
    authToken = jwt.sign(
      { id: testUser._id, email: testUser.email },
      process.env.JWT_SECRET
    );
  });

  describe("GET /api/polar/connect", () => {
    it("should return authorization URL", async () => {
      const res = await request(app)
        .get("/api/polar/connect")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.authorizationUrl).toContain(
        "https://flow.polar.com/oauth2/authorization"
      );
      expect(res.body.authorizationUrl).toContain("client_id=test-client-id");
    });

    it("should return 401 without authorization", async () => {
      const res = await request(app).get("/api/polar/connect");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/polar/callback", () => {
    it("should process callback and redirect", async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: {
          access_token: "new-access-token",
          expires_in: 3600,
          x_user_id: 12345,
        },
      });
      mockAxios.post.mockResolvedValueOnce({ data: {} });

      const res = await request(app)
        .get("/api/polar/callback")
        .query({
          code: "auth-code",
          state: testUser._id.toString(),
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("dashboard");

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.connections).toHaveLength(1);
      expect(updatedUser.connections[0].provider).toBe("polar");
    });

    it("should return 400 for missing state", async () => {
      const res = await request(app)
        .get("/api/polar/callback")
        .query({ code: "auth-code" });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Missing state");
    });

    it("should return 400 for missing code", async () => {
      const res = await request(app)
        .get("/api/polar/callback")
        .query({ state: testUser._id.toString() });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("No code provided");
    });

    it("should return 400 when error parameter is present", async () => {
      const res = await request(app).get("/api/polar/callback").query({
        error: "access_denied",
        state: testUser._id.toString(),
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("access_denied");
    });
  });

  describe("GET /api/polar/status", () => {
    it("should return connected: false when not connected", async () => {
      const res = await request(app)
        .get("/api/polar/status")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.connected).toBe(false);
      expect(res.body.meta.hasConnection).toBe(false);
    });

    it("should return connected: true when connected", async () => {
      const futureDate = new Date(Date.now() + 3600000);
      testUser.connections.push({
        provider: "polar",
        accessToken: "valid-token",
        expiresAt: futureDate,
        providerUserId: "12345",
      });
      await testUser.save();

      const res = await request(app)
        .get("/api/polar/status")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.connected).toBe(true);
      expect(res.body.providerUserId).toBe("12345");
    });

    it("should return 401 without authorization", async () => {
      const res = await request(app).get("/api/polar/status");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/polar/exercises", () => {
    beforeEach(async () => {
      const futureDate = new Date(Date.now() + 3600000);
      testUser.connections.push({
        provider: "polar",
        accessToken: "valid-token",
        expiresAt: futureDate,
        providerUserId: "12345",
      });
      await testUser.save();
    });

    it("should return exercises from Polar API", async () => {
      const mockExercises = [
        { id: "ex1", sport: "RUNNING" },
        { id: "ex2", sport: "CYCLING" },
      ];
      mockAxios.get.mockResolvedValueOnce({ data: mockExercises });

      const res = await request(app)
        .get("/api/polar/exercises")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockExercises);
    });

    it("should return 401 when not connected", async () => {
      const newUser = await registerUser("noconn@example.com", "ValidPass123");
      const newToken = jwt.sign(
        { id: newUser._id, email: newUser.email },
        process.env.JWT_SECRET
      );

      const res = await request(app)
        .get("/api/polar/exercises")
        .set("Authorization", `Bearer ${newToken}`);

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/polar/exercise/:id", () => {
    beforeEach(async () => {
      const futureDate = new Date(Date.now() + 3600000);
      testUser.connections.push({
        provider: "polar",
        accessToken: "valid-token",
        expiresAt: futureDate,
        providerUserId: "12345",
      });
      await testUser.save();
    });

    it("should return single exercise from Polar API", async () => {
      const mockExercise = { id: "ex1", sport: "RUNNING", duration: "PT1H" };
      mockAxios.get.mockResolvedValueOnce({ data: mockExercise });

      const res = await request(app)
        .get("/api/polar/exercise/ex1")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockExercise);
    });

    it("should return 404 for non-existent exercise", async () => {
      mockAxios.get.mockRejectedValueOnce({
        response: { status: 404 },
      });

      const res = await request(app)
        .get("/api/polar/exercise/nonexistent")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});
