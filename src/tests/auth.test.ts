import request from "supertest";
import app from "../app";
import { prismaMock } from "./setup";
import bcrypt from "bcrypt";

describe("Authentication API", () => {
  describe("POST /api/v1/auth/register", () => {
    const validRegisterData = {
      username: "testuser",
      email: "test@example.com",
      password: "SecurePass123!",
      confirmPassword: "SecurePass123!",
      full_name: "Test User",
    };

    it("should successfully register a new user", async () => {
      // Mock: no user exists with this username/email
      prismaMock.users.findFirst.mockResolvedValue(null);

      // Mock: user creation
      prismaMock.users.create.mockResolvedValue({
        id: "1" as any,
        username: "testuser",
        email: "test@example.com",
        full_name: "Test User",
      });

      // Mock: verification token creation
      prismaMock.email_verification_tokens.create.mockResolvedValue({
        id: "1" as any,
        user_id: "1" as any,
        token: "verification-token",
        expires_at: new Date(),
      });

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(validRegisterData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("message");
      expect(res.body.data.user).toEqual({
        id: "1", // BigInt serialized to string by our middleware
        email: "test@example.com",
        username: "testuser",
        full_name: "Test User",
      });

      expect(prismaMock.users.findFirst).toHaveBeenCalledTimes(1);
      expect(prismaMock.users.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.email_verification_tokens.create).toHaveBeenCalledTimes(1);
    });

    it("should return 400 Validation Error if passwords do not match", async () => {
      const invalidData = {
        ...validRegisterData,
        confirmPassword: "DifferentPass123!",
      };

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(invalidData);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation error");
      expect(res.body.details[0].field).toBe("confirmPassword");
    });

    it("should return 400 Validation Error if email format is invalid", async () => {
      const invalidData = {
        ...validRegisterData,
        email: "invalid-email",
      };

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(invalidData);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation error");
      expect(res.body.details[0].field).toBe("email");
    });

    it("should return 409 Conflict if email already exists", async () => {
      // Mock: user already exists
      prismaMock.users.findFirst.mockResolvedValue({
        id: "1" as any,
        username: "existinguser",
        email: "test@example.com",
      });

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send(validRegisterData);

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("already exists");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    const loginData = {
      email: "test@example.com",
      password: "SecurePass123!",
    };

    const mockUser = {
      id: "1" as any,
      username: "testuser",
      email: "test@example.com",
      password_hash: "hashedpassword",
      full_name: "Test User",
      role: "user",
      status: "active",
      email_verified: true,
    };

    it("should successfully log in and return a JWT token", async () => {
      prismaMock.users.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true as never);

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send(loginData);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.data).toHaveProperty("token");
      expect(res.body.data.user).toEqual({
        id: "1",
        email: "test@example.com",
        username: "testuser",
        full_name: "Test User",
        role: "user",
      });
    });

    it("should return 403 Forbidden if user email is not verified", async () => {
      prismaMock.users.findUnique.mockResolvedValue({
        ...mockUser,
        email_verified: false,
      });
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true as never);

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send(loginData);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("verify your email");
    });

    it("should return 403 Forbidden if user is banned", async () => {
      prismaMock.users.findUnique.mockResolvedValue({
        ...mockUser,
        status: "banned",
      });

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send(loginData);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("banned");
    });

    it("should return 401 Unauthorized for incorrect password", async () => {
      prismaMock.users.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(false as never);

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send(loginData);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Invalid email or password");
    });

    it("should return 401 Unauthorized if user email does not exist", async () => {
      prismaMock.users.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send(loginData);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Invalid email or password");
    });
  });
});
