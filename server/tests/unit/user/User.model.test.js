import mongoose from "mongoose";
import User from "../../../src/user/model/User.model.js";

describe("User Model", () => {
  describe("Schema validation", () => {
    it("should create a valid user with email and password", async () => {
      const userData = {
        email: "test@example.com",
        passwordHash: "hashedpassword123",
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe("test@example.com");
      expect(savedUser.passwordHash).toBe("hashedpassword123");
      expect(savedUser.connections).toEqual([]);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it("should require email", async () => {
      const user = new User({ passwordHash: "hashedpassword123" });

      await expect(user.save()).rejects.toThrow("email is required");
    });

    it("should require passwordHash", async () => {
      const user = new User({ email: "test@example.com" });

      await expect(user.save()).rejects.toThrow("password is required");
    });

    it("should enforce unique email", async () => {
      const userData = {
        email: "unique@example.com",
        passwordHash: "hashedpassword123",
      };

      await new User(userData).save();

      const duplicateUser = new User(userData);
      await expect(duplicateUser.save()).rejects.toThrow();
    });

    it("should convert email to lowercase", async () => {
      const user = new User({
        email: "TEST@EXAMPLE.COM",
        passwordHash: "hashedpassword123",
      });

      const savedUser = await user.save();
      expect(savedUser.email).toBe("test@example.com");
    });

    it("should trim email whitespace", async () => {
      const user = new User({
        email: "  test@example.com  ",
        passwordHash: "hashedpassword123",
      });

      const savedUser = await user.save();
      expect(savedUser.email).toBe("test@example.com");
    });
  });

  describe("Connections subdocument", () => {
    it("should save valid connection", async () => {
      const user = new User({
        email: "test@example.com",
        passwordHash: "hashedpassword123",
        connections: [
          {
            provider: "polar",
            accessToken: "token123",
            expiresAt: new Date(),
            providerUserId: "polar123",
          },
        ],
      });

      const savedUser = await user.save();
      expect(savedUser.connections).toHaveLength(1);
      expect(savedUser.connections[0].provider).toBe("polar");
      expect(savedUser.connections[0].accessToken).toBe("token123");
    });

    it("should reject invalid provider", async () => {
      const user = new User({
        email: "test@example.com",
        passwordHash: "hashedpassword123",
        connections: [
          {
            provider: "invalid_provider",
            accessToken: "token123",
          },
        ],
      });

      await expect(user.save()).rejects.toThrow();
    });

    it("should require accessToken in connection", async () => {
      const user = new User({
        email: "test@example.com",
        passwordHash: "hashedpassword123",
        connections: [
          {
            provider: "polar",
          },
        ],
      });

      await expect(user.save()).rejects.toThrow();
    });
  });
});
