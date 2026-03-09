import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import { connectDB, disconnectDB } from "./lib/db.js";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";
// Import routes
import authRoutes from "./user/route/auth.routes.js";
import polarRoutes from "./integration/route/polar.routes.js";
import activityRoutes from "./activity/route/activity.routes.js";

dotenv.config();

//Start of the server
const app = express();
await connectDB();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

//Swagger
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openapiPath = path.join(__dirname, "../docs", "openapi.yaml");
const openapiDoc = yaml.load(fs.readFileSync(openapiPath, "utf8"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));

//Security headers
app.use(
  helmet({
    strictTransportSecurity: false,
  }),
);

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);

//Logging
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(compression());

//Health check
app.get("/healthz", (req, res) => {
  res.json({ ok: true, env: NODE_ENV, ts: new Date().toISOString() });
});

// API routes
// Public auth routes
app.use("/api/auth", authRoutes);

// Routes for OAuth integrations
app.use("/api", polarRoutes);

// Routes for activities
app.use("/api/activities", activityRoutes);

//404 fallback for unknown endpoints
app.use((req, res, next) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

//Centralized error handler
app.use((err, req, res, next) => {
  console.error("[ERROR]", err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.name || "ServerError",
    message: err.message || "Internal Server Error",
  });
});

// Start of the server
const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Closing server...`);
  await disconnectDB();
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
