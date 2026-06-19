import request from "supertest";
import app from "../app";
import { prismaMock } from "./setup";
import { generateAccessToken } from "../services/token.service";

describe("Admin API Security & Operations", () => {
  const adminToken = generateAccessToken({
    userId: "99" as any,
    email: "admin@example.com",
    role: "admin",
  });

  const userToken = generateAccessToken({
    userId: "1" as any,
    email: "user@example.com",
    role: "user",
  });

  describe("Authentication and Authorization check", () => {
    it("should return 401 Unauthorized if no token is provided", async () => {
      const res = await request(app).get("/api/v1/admin/stats");
      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Access token is missing");
    });

    it("should return 403 Forbidden if a regular user token is provided", async () => {
      const res = await request(app)
        .get("/api/v1/admin/stats")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Forbidden");
    });

    it("should allow an admin to access stats", async () => {
      // Mock stats counts
      prismaMock.photos.count.mockResolvedValue(10);
      prismaMock.users.count.mockResolvedValue(5);
      prismaMock.likes.count.mockResolvedValue(20);
      prismaMock.comments.count.mockResolvedValue(15);
      prismaMock.reports.count.mockResolvedValue(2);
      prismaMock.tags.findMany.mockResolvedValue([
        { name: "nature", _count: { photo_tags: 5 } }
      ]);

      const res = await request(app)
        .get("/api/v1/admin/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("stats retrieved successfully");
      expect(res.body.data.total_photos).toBe(10);
      expect(res.body.data.total_users).toBe(5);
    });
  });

  describe("PATCH /api/v1/admin/photos/:id/moderate", () => {
    it("should update photo status to approved", async () => {
      prismaMock.photos.findUnique.mockResolvedValue({ id: "1" as any, title: "Test" } as any);
      prismaMock.photos.update.mockResolvedValue({ id: "1" as any, status: "approved" } as any);

      const res = await request(app)
        .patch("/api/v1/admin/photos/1/moderate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "approved" });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("approved");
      expect(prismaMock.photos.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: { status: "approved" },
      });
    });

    it("should return 400 validation error for invalid status value", async () => {
      const res = await request(app)
        .patch("/api/v1/admin/photos/1/moderate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "invalid_status" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation error");
    });
  });

  describe("PATCH /api/v1/admin/users/:id/status", () => {
    it("should update user status to banned", async () => {
      prismaMock.users.findUnique.mockResolvedValue({ id: "5" as any, username: "spammer" } as any);
      prismaMock.users.update.mockResolvedValue({
        id: "5" as any,
        username: "spammer",
        status: "banned",
      } as any);

      const res = await request(app)
        .patch("/api/v1/admin/users/5/status")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "banned" });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("banned");
      expect(prismaMock.users.update).toHaveBeenCalledWith({
        where: { id: BigInt(5) },
        data: { status: "banned" },
        select: expect.any(Object),
      });
    });
  });

  describe("DELETE /api/v1/admin/photos/:id", () => {
    it("should allow admin to delete any photo", async () => {
      prismaMock.photos.findUnique.mockResolvedValue({ id: BigInt(10) } as any);
      prismaMock.photos.delete.mockResolvedValue({} as any);

      const res = await request(app)
        .delete("/api/v1/admin/photos/10")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Photo deleted by administrator");
      expect(prismaMock.photos.delete).toHaveBeenCalledWith({
        where: { id: BigInt(10) },
      });
    });
  });

  describe("DELETE /api/v1/admin/comments/:id", () => {
    it("should allow admin to delete any comment and update comment count", async () => {
      prismaMock.comments.findUnique.mockResolvedValue({ id: BigInt(20), photo_id: BigInt(5) } as any);
      prismaMock.comments.delete.mockResolvedValue({} as any);
      prismaMock.photos.update.mockResolvedValue({} as any);

      const res = await request(app)
        .delete("/api/v1/admin/comments/20")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Comment deleted by administrator");
      expect(prismaMock.comments.delete).toHaveBeenCalledWith({
        where: { id: BigInt(20) },
      });
      expect(prismaMock.photos.update).toHaveBeenCalledWith({
        where: { id: BigInt(5) },
        data: { comments_count: { decrement: 1 } },
      });
    });
  });
});
