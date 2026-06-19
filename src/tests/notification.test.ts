import request from "supertest";
import app from "../app";
import { prismaMock } from "./setup";
import { generateAccessToken } from "../services/token.service";

describe("Notifications API", () => {
  const userToken = generateAccessToken({
    userId: "1" as any,
    email: "user@example.com",
    role: "user",
  });

  describe("GET /api/v1/notifications", () => {
    it("should return 401 without a token", async () => {
      const res = await request(app).get("/api/v1/notifications");
      expect(res.status).toBe(401);
    });

    it("should return a mapped list of notifications", async () => {
      prismaMock.notifications.findMany.mockResolvedValue([
        {
          id: "10" as any,
          type: "comment",
          is_read: false,
          created_at: new Date(),
          photo_id: "5" as any,
          comment_id: "3" as any,
          actor: {
            id: "2" as any,
            username: "bob",
            full_name: "Bob",
            avatar_url: null,
          },
        },
      ] as any);
      prismaMock.notifications.count.mockResolvedValue(1);
      prismaMock.photos.findMany.mockResolvedValue([
        { id: "5" as any, title: "Ảnh đẹp" },
      ] as any);

      const res = await request(app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].type).toBe("comment");
      expect(res.body.data[0].photo_title).toBe("Ảnh đẹp");
      expect(res.body.meta).toHaveProperty("unread");
    });
  });

  describe("GET /api/v1/notifications/unread-count", () => {
    it("should return the unread count", async () => {
      prismaMock.notifications.count.mockResolvedValue(4);

      const res = await request(app)
        .get("/api/v1/notifications/unread-count")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.unread).toBe(4);
    });
  });

  describe("PATCH /api/v1/notifications/:id/read", () => {
    it("should mark a notification as read", async () => {
      prismaMock.notifications.updateMany.mockResolvedValue({ count: 1 } as any);

      const res = await request(app)
        .patch("/api/v1/notifications/10/read")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(prismaMock.notifications.updateMany).toHaveBeenCalledWith({
        where: { id: BigInt(10), recipient_id: BigInt(1) },
        data: { is_read: true },
      });
    });
  });

  describe("PATCH /api/v1/notifications/read-all", () => {
    it("should mark all notifications as read", async () => {
      prismaMock.notifications.updateMany.mockResolvedValue({ count: 3 } as any);

      const res = await request(app)
        .patch("/api/v1/notifications/read-all")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(prismaMock.notifications.updateMany).toHaveBeenCalledWith({
        where: { recipient_id: BigInt(1), is_read: false },
        data: { is_read: true },
      });
    });
  });
});
