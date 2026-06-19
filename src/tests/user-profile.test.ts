import request from "supertest";
import bcrypt from "bcrypt";
import app from "../app";
import { prismaMock } from "./setup";
import { generateAccessToken } from "../services/token.service";

describe("User Profile Management", () => {
  const userToken = generateAccessToken({
    userId: "1" as any,
    email: "user@example.com",
    role: "user",
  });

  describe("GET /api/v1/users/:id (enriched profile)", () => {
    it("should return profile with stats and is_following=false for a guest", async () => {
      prismaMock.users.findUnique.mockResolvedValue({
        id: "1" as any,
        username: "alice",
        email: "alice@example.com",
        full_name: "Alice",
        avatar_url: null,
        bio: "hello",
        email_verified: true,
        role: "user",
        created_at: new Date(),
      } as any);
      prismaMock.photos.count.mockResolvedValue(3);
      prismaMock.follows.count.mockResolvedValue(2);
      prismaMock.photos.aggregate.mockResolvedValue({
        _sum: { likes_count: 10 },
      } as any);

      const res = await request(app).get("/api/v1/users/1");

      expect(res.status).toBe(200);
      expect(res.body.data.user.photos_count).toBe(3);
      expect(res.body.data.user.followers_count).toBe(2);
      expect(res.body.data.user.following_count).toBe(2);
      expect(res.body.data.user.likes_count).toBe(10);
      expect(res.body.data.user.is_following).toBe(false);
    });
  });

  describe("PATCH /api/v1/users/:id (update own profile)", () => {
    it("should update the authenticated user's own profile", async () => {
      prismaMock.users.update.mockResolvedValue({
        id: "1" as any,
        username: "alice",
        email: "alice@example.com",
        full_name: "Alice Updated",
        avatar_url: null,
        bio: "new bio",
        email_verified: true,
        created_at: new Date(),
      } as any);

      const res = await request(app)
        .patch("/api/v1/users/1")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ full_name: "Alice Updated", bio: "new bio" });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Profile updated successfully");
      expect(res.body.data.user.full_name).toBe("Alice Updated");
    });

    it("should return 403 when updating another user's profile", async () => {
      const res = await request(app)
        .patch("/api/v1/users/2")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ full_name: "Hacker" });

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/v1/users/me/change-password", () => {
    it("should change password when current password is correct", async () => {
      const hash = await bcrypt.hash("oldpass123", 10);
      prismaMock.users.findUnique.mockResolvedValue({
        id: "1" as any,
        password_hash: hash,
      } as any);
      prismaMock.users.update.mockResolvedValue({ id: "1" as any } as any);

      const res = await request(app)
        .post("/api/v1/users/me/change-password")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          currentPassword: "oldpass123",
          newPassword: "newpass123",
          confirmPassword: "newpass123",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Password changed successfully");
      expect(prismaMock.users.update).toHaveBeenCalled();
    });

    it("should return 400 when current password is incorrect", async () => {
      const hash = await bcrypt.hash("differentpass", 10);
      prismaMock.users.findUnique.mockResolvedValue({
        id: "1" as any,
        password_hash: hash,
      } as any);

      const res = await request(app)
        .post("/api/v1/users/me/change-password")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          currentPassword: "oldpass123",
          newPassword: "newpass123",
          confirmPassword: "newpass123",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Current password is incorrect");
    });

    it("should return 400 validation error when confirmation does not match", async () => {
      const res = await request(app)
        .post("/api/v1/users/me/change-password")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          currentPassword: "oldpass123",
          newPassword: "newpass123",
          confirmPassword: "mismatch123",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation error");
    });

    it("should return 401 without a token", async () => {
      const res = await request(app)
        .post("/api/v1/users/me/change-password")
        .send({
          currentPassword: "oldpass123",
          newPassword: "newpass123",
          confirmPassword: "newpass123",
        });

      expect(res.status).toBe(401);
    });
  });
});
