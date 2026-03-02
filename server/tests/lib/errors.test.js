import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  IntegrationError,
} from "../../src/lib/errors.js";

describe("AppError", () => {
  it("should create error with message and status", () => {
    const error = new AppError("Test error", 500);

    expect(error.message).toBe("Test error");
    expect(error.status).toBe(500);
    expect(error.name).toBe("AppError");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("BadRequestError", () => {
  it("should have status 400 and default message", () => {
    const error = new BadRequestError();

    expect(error.status).toBe(400);
    expect(error.message).toBe("Bad Request");
    expect(error.name).toBe("BadRequestError");
  });

  it("should accept custom message", () => {
    const error = new BadRequestError("Invalid input");

    expect(error.status).toBe(400);
    expect(error.message).toBe("Invalid input");
  });
});

describe("UnauthorizedError", () => {
  it("should have status 401 and default message", () => {
    const error = new UnauthorizedError();

    expect(error.status).toBe(401);
    expect(error.message).toBe("Unauthorized");
    expect(error.name).toBe("UnauthorizedError");
  });

  it("should accept custom message", () => {
    const error = new UnauthorizedError("Invalid token");

    expect(error.status).toBe(401);
    expect(error.message).toBe("Invalid token");
  });
});

describe("NotFoundError", () => {
  it("should have status 404 and default message", () => {
    const error = new NotFoundError();

    expect(error.status).toBe(404);
    expect(error.message).toBe("Not Found");
    expect(error.name).toBe("NotFoundError");
  });

  it("should accept custom message", () => {
    const error = new NotFoundError("User not found");

    expect(error.status).toBe(404);
    expect(error.message).toBe("User not found");
  });
});

describe("ConflictError", () => {
  it("should have status 409 and default message", () => {
    const error = new ConflictError();

    expect(error.status).toBe(409);
    expect(error.message).toBe("Conflict");
    expect(error.name).toBe("ConflictError");
  });

  it("should accept custom message", () => {
    const error = new ConflictError("Email already exists");

    expect(error.status).toBe(409);
    expect(error.message).toBe("Email already exists");
  });
});

describe("IntegrationError", () => {
  it("should have status 502 and default message", () => {
    const error = new IntegrationError();

    expect(error.status).toBe(502);
    expect(error.message).toBe("External service integration failed");
    expect(error.name).toBe("IntegrationError");
  });

  it("should accept custom message", () => {
    const error = new IntegrationError("Strava API unavailable");

    expect(error.status).toBe(502);
    expect(error.message).toBe("Strava API unavailable");
  });
});
