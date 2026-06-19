import request from "supertest";
import app from "../app";
import { prismaMock } from "./setup";
import { generateAccessToken } from "../services/token.service";

describe("Reports & Admin Moderation Reports", () => {
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

  describe("POST /api/v1/reports (user submits a report)", () => {
    it("should return 401 if no token is provided", async () => {
      const res = await request(app)
        .post("/api/v1/reports")
        .send({ target_type: "photo", target_id: 5, reason: "Spam" });
      expect(res.status).toBe(401);
    });

    it("should create a report for a photo", async () => {
      prismaMock.photos.findUnique.mockResolvedValue({ id: "5" as any } as any);
      prismaMock.reports.findFirst.mockResolvedValue(null as any);
      prismaMock.reports.create.mockResolvedValue({
        id: "1" as any,
        target_type: "photo",
        photo_id: "5" as any,
        reason: "Spam",
        status: "pending",
      } as any);

      const res = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ target_type: "photo", target_id: 5, reason: "Spam" });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain("Report submitted successfully");
      expect(prismaMock.reports.create).toHaveBeenCalled();
    });

    it("should return 400 for invalid target_type", async () => {
      const res = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ target_type: "user", target_id: 5, reason: "Spam" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation error");
    });

    it("should return 404 if reported photo does not exist", async () => {
      prismaMock.photos.findUnique.mockResolvedValue(null as any);

      const res = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ target_type: "photo", target_id: 999, reason: "Spam" });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Photo not found");
    });

    it("should return 409 when the same user reports the same content twice", async () => {
      prismaMock.photos.findUnique.mockResolvedValue({ id: "5" as any } as any);
      prismaMock.reports.findFirst.mockResolvedValue({ id: "1" as any } as any);

      const res = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ target_type: "photo", target_id: 5, reason: "Spam" });

      expect(res.status).toBe(409);
    });
  });

  describe("GET /api/v1/admin/reports", () => {
    it("should return 403 for a regular user", async () => {
      const res = await request(app)
        .get("/api/v1/admin/reports")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it("should return a mapped list of reports for an admin", async () => {
      prismaMock.reports.findMany.mockResolvedValue([
        {
          id: "1" as any,
          target_type: "photo",
          reason: "Spam",
          description: null,
          status: "pending",
          created_at: new Date(),
          photo_id: "5" as any,
          comment_id: null,
          reporter: { id: "1" as any, username: "reporter1", avatar_url: null },
          photo: {
            id: "5" as any,
            title: "Bức ảnh vi phạm",
            image_url: "http://img/5.jpg",
            status: "approved",
            users: { id: "2" as any, username: "owner1" },
          },
          comment: null,
        },
      ] as any);
      prismaMock.reports.count.mockResolvedValue(1);

      const res = await request(app)
        .get("/api/v1/admin/reports")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].content).toBe("Bức ảnh vi phạm");
      expect(res.body.data[0].reported_by).toBe("reporter1");
      expect(res.body.data[0].content_owner).toBe("owner1");
    });
  });

  describe("PATCH /api/v1/admin/reports/:id/resolve", () => {
    it("should remove the reported photo and resolve the report", async () => {
      prismaMock.reports.findUnique.mockResolvedValue({
        id: "1" as any,
        target_type: "photo",
        photo_id: "5" as any,
        comment_id: null,
      } as any);
      prismaMock.photos.findUnique.mockResolvedValue({ id: "5" as any } as any);
      prismaMock.photos.delete.mockResolvedValue({} as any);

      const res = await request(app)
        .patch("/api/v1/admin/reports/1/resolve")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(prismaMock.photos.delete).toHaveBeenCalledWith({
        where: { id: BigInt(5) },
      });
    });
  });

  describe("DELETE /api/v1/admin/reports/:id (dismiss)", () => {
    it("should dismiss (delete) a report without touching content", async () => {
      prismaMock.reports.findUnique.mockResolvedValue({ id: "1" as any } as any);
      prismaMock.reports.delete.mockResolvedValue({} as any);

      const res = await request(app)
        .delete("/api/v1/admin/reports/1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("dismissed");
      expect(prismaMock.reports.delete).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
      });
    });
  });
});
