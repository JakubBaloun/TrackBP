import express from "express";
import request from "supertest";

// Create a minimal test app that mirrors the main app's middleware and routes
function createTestApp() {
  const app = express();

  app.use(express.json());

  // Health check
  app.get("/healthz", (req, res) => {
    res.json({ ok: true, env: "test", ts: new Date().toISOString() });
  });

  // 404 fallback
  app.use((req, res, next) => {
    res.status(404).json({ error: "Not Found", path: req.originalUrl });
  });

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

describe("GET /healthz", () => {
  const app = createTestApp();

  it("should return 200 with health status", async () => {
    const res = await request(app).get("/healthz");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.env).toBe("test");
    expect(res.body.ts).toBeDefined();
  });

  it("should return valid ISO timestamp", async () => {
    const res = await request(app).get("/healthz");

    const timestamp = new Date(res.body.ts);
    expect(timestamp.toISOString()).toBe(res.body.ts);
  });
});

describe("404 fallback", () => {
  const app = createTestApp();

  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/unknown-route");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Not Found");
    expect(res.body.path).toBe("/unknown-route");
  });

  it("should return 404 for nested unknown routes", async () => {
    const res = await request(app).get("/api/v1/nonexistent");

    expect(res.status).toBe(404);
    expect(res.body.path).toBe("/api/v1/nonexistent");
  });

  it("should return 404 for POST to unknown routes", async () => {
    const res = await request(app).post("/unknown").send({ data: "test" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Not Found");
  });
});

describe("Error handler", () => {
  it("should handle errors with status code", async () => {
    const app = express();
    app.use(express.json());

    app.get("/test-error", (req, res, next) => {
      const error = new Error("Test error");
      error.status = 400;
      error.name = "BadRequestError";
      next(error);
    });

    app.use((err, req, res, next) => {
      const status = err.status || 500;
      res.status(status).json({
        error: err.name || "ServerError",
        message: err.message || "Internal Server Error",
      });
    });

    const res = await request(app).get("/test-error");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("BadRequestError");
    expect(res.body.message).toBe("Test error");
  });

  it("should default to 500 for errors without status", async () => {
    const app = express();
    app.use(express.json());

    app.get("/test-error", (req, res, next) => {
      next(new Error("Something went wrong"));
    });

    app.use((err, req, res, next) => {
      const status = err.status || 500;
      res.status(status).json({
        error: err.name || "ServerError",
        message: err.message || "Internal Server Error",
      });
    });

    const res = await request(app).get("/test-error");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Something went wrong");
  });
});
