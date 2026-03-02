import express from "express";
import request from "supertest";
import authRoutes from "../../src/user/route/auth.routes.js";
import { registerUser } from "../../src/user/service/auth.service.js";

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);

  // Error handler
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({
      error: err.name || "ServerError",
      message: err.message || "Internal Server Error",
    });
  });

  return app;
}

describe("Auth Routes", () => {
  const app = createTestApp();

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "newuser@example.com",
        password: "ValidPass123",
      });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("User created successfully");
      expect(res.body.email).toBe("newuser@example.com");
      expect(res.body.userId).toBeDefined();
    });

    it("should return 400 for missing email", async () => {
      const res = await request(app).post("/api/auth/register").send({
        password: "ValidPass123",
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("BadRequestError");
    });

    it("should return 400 for missing password", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("BadRequestError");
    });

    it("should return 400 for invalid email format", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "invalid-email",
        password: "ValidPass123",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Email format is invalid");
    });

    it("should return 400 for weak password", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        password: "weak",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Password must be");
    });

    it("should return 409 for duplicate email", async () => {
      await request(app).post("/api/auth/register").send({
        email: "duplicate@example.com",
        password: "ValidPass123",
      });

      const res = await request(app).post("/api/auth/register").send({
        email: "duplicate@example.com",
        password: "AnotherPass123",
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("ConflictError");
      expect(res.body.message).toBe("User with this email already exists");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await registerUser("logintest@example.com", "ValidPass123");
    });

    it("should login successfully and return token", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "logintest@example.com",
        password: "ValidPass123",
      });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(typeof res.body.token).toBe("string");
    });

    it("should return 400 for missing email", async () => {
      const res = await request(app).post("/api/auth/login").send({
        password: "ValidPass123",
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("BadRequestError");
    });

    it("should return 400 for missing password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "logintest@example.com",
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("BadRequestError");
    });

    it("should return 401 for wrong password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "logintest@example.com",
        password: "WrongPass123",
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("UnauthorizedError");
      expect(res.body.message).toBe("Invalid credentials");
    });

    it("should return 401 for non-existent user", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: "ValidPass123",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid credentials");
    });

    it("should be case-insensitive for email", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "LOGINTEST@EXAMPLE.COM",
        password: "ValidPass123",
      });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });
  });

  describe("GET /api/auth/me", () => {
    let authToken;

    beforeEach(async () => {
      await registerUser("metest@example.com", "ValidPass123");
      const loginRes = await request(app).post("/api/auth/login").send({
        email: "metest@example.com",
        password: "ValidPass123",
      });
      authToken = loginRes.body.token;
    });

    it("should return user profile with valid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe("metest@example.com");
      expect(res.body.id).toBeDefined();
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.passwordHash).toBeUndefined();
    });

    it("should return 401 without authorization header", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("UnauthorizedError");
      expect(res.body.message).toBe("User not authorized, missing token");
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token");

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("User not authorized, token invalid");
    });

    it("should return 401 with malformed authorization header", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Basic sometoken");

      expect(res.status).toBe(401);
    });
  });
});
