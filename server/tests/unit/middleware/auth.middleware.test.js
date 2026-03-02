import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { protect } from "../../../src/middleware/auth.middleware.js";
import { UnauthorizedError } from "../../../src/lib/errors.js";

describe("Auth Middleware", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  describe("protect middleware", () => {
    it("should call next() with valid token", () => {
      const payload = { id: "user123", email: "test@example.com" };
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;

      protect(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe("user123");
      expect(mockReq.user.email).toBe("test@example.com");
    });

    it("should throw UnauthorizedError when no authorization header", () => {
      expect(() => protect(mockReq, mockRes, mockNext)).toThrow(
        UnauthorizedError
      );
      expect(() => protect(mockReq, mockRes, mockNext)).toThrow(
        "User not authorized, missing token"
      );
    });

    it("should throw UnauthorizedError when authorization header doesn't start with Bearer", () => {
      mockReq.headers.authorization = "Basic sometoken";

      expect(() => protect(mockReq, mockRes, mockNext)).toThrow(
        UnauthorizedError
      );
      expect(() => protect(mockReq, mockRes, mockNext)).toThrow(
        "User not authorized, missing token"
      );
    });

    it("should throw UnauthorizedError for invalid token", () => {
      mockReq.headers.authorization = "Bearer invalid-token";

      expect(() => protect(mockReq, mockRes, mockNext)).toThrow(
        UnauthorizedError
      );
      expect(() => protect(mockReq, mockRes, mockNext)).toThrow(
        "User not authorized, token invalid"
      );
    });

    it("should throw UnauthorizedError for expired token", () => {
      const payload = { id: "user123", email: "test@example.com" };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "-1s",
      });
      mockReq.headers.authorization = `Bearer ${token}`;

      expect(() => protect(mockReq, mockRes, mockNext)).toThrow(
        UnauthorizedError
      );
      expect(() => protect(mockReq, mockRes, mockNext)).toThrow(
        "User not authorized, token invalid"
      );
    });

    it("should throw UnauthorizedError for token signed with wrong secret", () => {
      const payload = { id: "user123", email: "test@example.com" };
      const token = jwt.sign(payload, "wrong-secret");
      mockReq.headers.authorization = `Bearer ${token}`;

      expect(() => protect(mockReq, mockRes, mockNext)).toThrow(
        UnauthorizedError
      );
    });

    it("should handle Bearer with extra spaces", () => {
      const payload = { id: "user123", email: "test@example.com" };
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      mockReq.headers.authorization = `Bearer  ${token}`;

      // This will fail because split(" ")[1] will be empty
      expect(() => protect(mockReq, mockRes, mockNext)).toThrow(
        UnauthorizedError
      );
    });
  });
});
