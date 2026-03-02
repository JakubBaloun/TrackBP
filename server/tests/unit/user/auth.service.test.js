import jwt from "jsonwebtoken";
import {
  registerUser,
  loginUser,
  getUserProfile,
} from "../../../src/user/service/auth.service.js";
import User from "../../../src/user/model/User.model.js";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../../../src/lib/errors.js";

describe("Auth Service", () => {
  describe("registerUser", () => {
    const validEmail = "test@example.com";
    const validPassword = "ValidPass123";

    it("should register a new user successfully", async () => {
      const user = await registerUser(validEmail, validPassword);

      expect(user._id).toBeDefined();
      expect(user.email).toBe(validEmail);
      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe(validPassword);
    });

    it("should hash the password", async () => {
      const user = await registerUser(validEmail, validPassword);

      expect(user.passwordHash).not.toBe(validPassword);
      expect(user.passwordHash.length).toBeGreaterThan(50);
    });

    it("should throw BadRequestError for missing email", async () => {
      await expect(registerUser("", validPassword)).rejects.toThrow(
        BadRequestError
      );
    });

    it("should throw BadRequestError for invalid email format", async () => {
      await expect(registerUser("invalid-email", validPassword)).rejects.toThrow(
        BadRequestError
      );
      await expect(
        registerUser("invalid-email", validPassword)
      ).rejects.toThrow("Email format is invalid");
    });

    it("should throw BadRequestError for missing password", async () => {
      await expect(registerUser(validEmail, "")).rejects.toThrow(
        BadRequestError
      );
    });

    it("should throw BadRequestError for weak password - too short", async () => {
      await expect(registerUser(validEmail, "Short1")).rejects.toThrow(
        BadRequestError
      );
    });

    it("should throw BadRequestError for password without uppercase", async () => {
      await expect(registerUser(validEmail, "lowercase123")).rejects.toThrow(
        BadRequestError
      );
    });

    it("should throw BadRequestError for password without lowercase", async () => {
      await expect(registerUser(validEmail, "UPPERCASE123")).rejects.toThrow(
        BadRequestError
      );
    });

    it("should throw BadRequestError for password without number", async () => {
      await expect(registerUser(validEmail, "NoNumbersHere")).rejects.toThrow(
        BadRequestError
      );
    });

    it("should throw ConflictError for duplicate email", async () => {
      await registerUser(validEmail, validPassword);

      await expect(registerUser(validEmail, "AnotherPass123")).rejects.toThrow(
        ConflictError
      );
      await expect(registerUser(validEmail, "AnotherPass123")).rejects.toThrow(
        "User with this email already exists"
      );
    });
  });

  describe("loginUser", () => {
    const email = "login@example.com";
    const password = "ValidPass123";

    beforeEach(async () => {
      await registerUser(email, password);
    });

    it("should return a valid JWT token for correct credentials", async () => {
      const token = await loginUser(email, password);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.email).toBe(email);
      expect(decoded.id).toBeDefined();
    });

    it("should throw BadRequestError for missing email", async () => {
      await expect(loginUser("", password)).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError for invalid email format", async () => {
      await expect(loginUser("invalid", password)).rejects.toThrow(
        BadRequestError
      );
    });

    it("should throw BadRequestError for missing password", async () => {
      await expect(loginUser(email, "")).rejects.toThrow(BadRequestError);
    });

    it("should throw UnauthorizedError for non-existent user", async () => {
      await expect(
        loginUser("nonexistent@example.com", password)
      ).rejects.toThrow(UnauthorizedError);
      await expect(
        loginUser("nonexistent@example.com", password)
      ).rejects.toThrow("Invalid credentials");
    });

    it("should throw UnauthorizedError for wrong password", async () => {
      await expect(loginUser(email, "WrongPass123")).rejects.toThrow(
        UnauthorizedError
      );
      await expect(loginUser(email, "WrongPass123")).rejects.toThrow(
        "Invalid credentials"
      );
    });

    it("should be case-insensitive for email", async () => {
      const token = await loginUser("LOGIN@EXAMPLE.COM", password);
      expect(token).toBeDefined();
    });
  });

  describe("getUserProfile", () => {
    let testUser;

    beforeEach(async () => {
      testUser = await registerUser("profile@example.com", "ValidPass123");
    });

    it("should return user profile without sensitive data", async () => {
      const profile = await getUserProfile(testUser._id);

      expect(profile.id.toString()).toBe(testUser._id.toString());
      expect(profile.email).toBe("profile@example.com");
      expect(profile.createdAt).toBeDefined();
      expect(profile.updatedAt).toBeDefined();
      expect(profile.passwordHash).toBeUndefined();
      expect(profile.connections).toBeUndefined();
    });

    it("should throw NotFoundError for non-existent user", async () => {
      const fakeId = "507f1f77bcf86cd799439011";

      await expect(getUserProfile(fakeId)).rejects.toThrow(NotFoundError);
      await expect(getUserProfile(fakeId)).rejects.toThrow("User not found");
    });
  });
});
