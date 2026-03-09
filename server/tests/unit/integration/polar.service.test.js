import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import User from "../../../src/user/model/User.model.js";
import { UnauthorizedError, NotFoundError } from "../../../src/lib/errors.js";

// Mock axios before importing the service
const mockAxios = {
  get: jest.fn(),
  post: jest.fn(),
};

jest.unstable_mockModule("axios", () => ({
  default: mockAxios,
}));

// Import after mocking
const { getPolarAuthUrl, handlePolarCallback, getPolarConnectionStatus, getPolarExercises, getPolarExerciseById } = await import("../../../src/integration/service/polar.service.js");

describe("Polar Service", () => {
  let testUser;

  beforeEach(async () => {
    jest.clearAllMocks();

    process.env.POLAR_CLIENT_ID = "test-client-id";
    process.env.POLAR_CLIENT_SECRET = "test-client-secret";
    process.env.POLAR_REDIRECT_URI = "http://localhost:3000/api/polar/callback";

    testUser = await new User({
      email: "test@example.com",
      passwordHash: "hashedpassword123",
    }).save();
  });

  describe("getPolarAuthUrl", () => {
    it("should return authorization URL with correct parameters", async () => {
      const result = await getPolarAuthUrl(testUser._id.toString());

      expect(result.authorizationUrl).toContain(
        "https://flow.polar.com/oauth2/authorization"
      );
      expect(result.authorizationUrl).toContain("client_id=test-client-id");
      expect(result.authorizationUrl).toContain(
        "redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fpolar%2Fcallback"
      );
      expect(result.authorizationUrl).toContain("response_type=code");
      expect(result.authorizationUrl).toContain("scope=accesslink.read_all");
      expect(result.authorizationUrl).toContain(`state=${testUser._id}`);
    });
  });

  describe("handlePolarCallback", () => {
    const mockTokenResponse = {
      data: {
        access_token: "mock-access-token",
        expires_in: 3600,
        x_user_id: 12345,
      },
    };

    it("should exchange code for token and save connection", async () => {
      mockAxios.post.mockResolvedValueOnce(mockTokenResponse);
      mockAxios.post.mockResolvedValueOnce({ data: {} }); // register user

      const result = await handlePolarCallback("auth-code", testUser._id);

      expect(mockAxios.post).toHaveBeenCalledTimes(2);
      expect(result.connections).toHaveLength(1);
      expect(result.connections[0].provider).toBe("polar");
      expect(result.connections[0].accessToken).toBe("mock-access-token");
      expect(result.connections[0].providerUserId).toBe("12345");
    });

    it("should handle Polar user already registered (409)", async () => {
      mockAxios.post.mockResolvedValueOnce(mockTokenResponse);
      mockAxios.post.mockRejectedValueOnce({
        response: { status: 409 },
      });

      const result = await handlePolarCallback("auth-code", testUser._id);

      expect(result.connections).toHaveLength(1);
    });

    it("should update existing connection", async () => {
      testUser.connections.push({
        provider: "polar",
        accessToken: "old-token",
        expiresAt: new Date(),
        providerUserId: "12345",
      });
      await testUser.save();

      mockAxios.post.mockResolvedValueOnce(mockTokenResponse);
      mockAxios.post.mockResolvedValueOnce({ data: {} });

      const result = await handlePolarCallback("auth-code", testUser._id);

      expect(result.connections).toHaveLength(1);
      expect(result.connections[0].accessToken).toBe("mock-access-token");
    });

    it("should throw UnauthorizedError for non-existent user", async () => {
      mockAxios.post.mockResolvedValueOnce(mockTokenResponse);
      mockAxios.post.mockResolvedValueOnce({ data: {} });

      const fakeUserId = "507f1f77bcf86cd799439011";

      await expect(
        handlePolarCallback("auth-code", fakeUserId)
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("getPolarConnectionStatus", () => {
    it("should return connected: false when no connection exists", async () => {
      const result = await getPolarConnectionStatus(testUser._id);

      expect(result.connected).toBe(false);
      expect(result.meta.hasConnection).toBe(false);
      expect(result.meta.isExpired).toBe(false);
    });

    it("should return connected: true for valid connection", async () => {
      const futureDate = new Date(Date.now() + 3600000);
      testUser.connections.push({
        provider: "polar",
        accessToken: "valid-token",
        expiresAt: futureDate,
        providerUserId: "12345",
      });
      await testUser.save();

      const result = await getPolarConnectionStatus(testUser._id);

      expect(result.connected).toBe(true);
      expect(result.providerUserId).toBe("12345");
      expect(result.meta.hasConnection).toBe(true);
      expect(result.meta.isExpired).toBe(false);
    });

    it("should return connected: false for expired connection", async () => {
      const pastDate = new Date(Date.now() - 3600000);
      testUser.connections.push({
        provider: "polar",
        accessToken: "expired-token",
        expiresAt: pastDate,
        providerUserId: "12345",
      });
      await testUser.save();

      const result = await getPolarConnectionStatus(testUser._id);

      expect(result.connected).toBe(false);
      expect(result.meta.hasConnection).toBe(true);
      expect(result.meta.isExpired).toBe(true);
    });

    it("should throw NotFoundError for non-existent user", async () => {
      const fakeUserId = "507f1f77bcf86cd799439011";

      await expect(getPolarConnectionStatus(fakeUserId)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("getPolarExercises", () => {
    it("should fetch exercises from Polar API", async () => {
      const futureDate = new Date(Date.now() + 3600000);
      testUser.connections.push({
        provider: "polar",
        accessToken: "valid-token",
        expiresAt: futureDate,
        providerUserId: "12345",
      });
      await testUser.save();

      const mockExercises = [
        { id: "ex1", sport: "RUNNING" },
        { id: "ex2", sport: "CYCLING" },
      ];
      mockAxios.get.mockResolvedValueOnce({ data: mockExercises });

      const result = await getPolarExercises(testUser._id);

      expect(result).toEqual(mockExercises);
      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("/exercises"),
        expect.objectContaining({
          headers: {
            Authorization: "Bearer valid-token",
            Accept: "application/json",
          },
        })
      );
    });

    it("should throw NotFoundError for non-existent user", async () => {
      const fakeUserId = "507f1f77bcf86cd799439011";

      await expect(getPolarExercises(fakeUserId)).rejects.toThrow(
        NotFoundError
      );
    });

    it("should throw UnauthorizedError when not connected", async () => {
      await expect(getPolarExercises(testUser._id)).rejects.toThrow(
        UnauthorizedError
      );
    });

    it("should throw UnauthorizedError for expired token", async () => {
      const pastDate = new Date(Date.now() - 3600000);
      testUser.connections.push({
        provider: "polar",
        accessToken: "expired-token",
        expiresAt: pastDate,
        providerUserId: "12345",
      });
      await testUser.save();

      await expect(getPolarExercises(testUser._id)).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  describe("getPolarExerciseById", () => {
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

    it("should fetch single exercise from Polar API", async () => {
      const mockExercise = { id: "ex1", sport: "RUNNING", duration: "PT1H" };
      mockAxios.get.mockResolvedValueOnce({ data: mockExercise });

      const result = await getPolarExerciseById(testUser._id, "ex1");

      expect(result).toEqual(mockExercise);
      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("/exercises/ex1"),
        expect.any(Object)
      );
    });

    it("should throw NotFoundError for non-existent exercise", async () => {
      mockAxios.get.mockRejectedValueOnce({
        response: { status: 404 },
      });

      await expect(
        getPolarExerciseById(testUser._id, "nonexistent")
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError for non-existent user", async () => {
      const fakeUserId = "507f1f77bcf86cd799439011";

      await expect(getPolarExerciseById(fakeUserId, "ex1")).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
