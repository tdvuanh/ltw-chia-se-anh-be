import request from "supertest";
import app from "../app";
import { prismaMock } from "./setup";
import { generateAccessToken } from "../services/token.service";

describe("Likes API", () => {
  const userToken = generateAccessToken({
    userId: "1" as any,
    email: "user@example.com",
    role: "user",
  });

  const photoId = BigInt(10);

  describe("POST /api/v1/photos/:id/like", () => {
    it("should return 401 Unauthorized if no token is provided", async () => {
      const res = await request(app).post(`/api/v1/photos/${photoId}/like`);
      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Access token is missing");
    });

    it("should successfully like a photo and increment likes_count", async () => {
      // Mock: photo exists
      prismaMock.photos.findUnique.mockResolvedValue({
        id: "10" as any,
        title: "Test Photo",
        likes_count: 5,
      } as any);

      // Mock: not already liked
      prismaMock.likes.findUnique.mockResolvedValue(null);

      // Mock: like creation
      prismaMock.likes.create.mockResolvedValue({
        user_id: "1" as any,
        photo_id: "10" as any,
      } as any);

      // Mock: photo update
      prismaMock.photos.update.mockResolvedValue({
        id: "10" as any,
        likes_count: 6,
        likes: [{ user_id: "1" as any }],
      } as any);

      const res = await request(app)
        .post(`/api/v1/photos/${photoId}/like`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Photo liked successfully");
      expect(res.body.data.likes_count).toBe(6);

      expect(prismaMock.photos.findUnique).toHaveBeenCalledWith({
        where: { id: photoId },
      });
      expect(prismaMock.likes.findUnique).toHaveBeenCalledWith({
        where: {
          user_id_photo_id: {
            user_id: "1",
            photo_id: photoId,
          },
        },
      });
      expect(prismaMock.likes.create).toHaveBeenCalledWith({
        data: {
          user_id: "1",
          photo_id: photoId,
        },
      });
      expect(prismaMock.photos.update).toHaveBeenCalledWith({
        where: { id: photoId },
        data: {
          likes_count: {
            increment: 1,
          },
        },
        include: {
          likes: {
            select: { user_id: true },
          },
        },
      });
    });

    it("should return 404 Not Found if the photo does not exist", async () => {
      // Mock: photo does not exist
      prismaMock.photos.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/v1/photos/${photoId}/like`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Photo not found");
    });

    it("should return 409 Conflict if the user already liked the photo", async () => {
      // Mock: photo exists
      prismaMock.photos.findUnique.mockResolvedValue({
        id: "10" as any,
        title: "Test Photo",
      } as any);

      // Mock: already liked
      prismaMock.likes.findUnique.mockResolvedValue({
        user_id: "1" as any,
        photo_id: "10" as any,
      } as any);

      const res = await request(app)
        .post(`/api/v1/photos/${photoId}/like`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(409);
      expect(res.body.message).toBe("You already liked this photo");
    });
  });

  describe("DELETE /api/v1/photos/:id/like", () => {
    it("should return 401 Unauthorized if no token is provided", async () => {
      const res = await request(app).delete(`/api/v1/photos/${photoId}/like`);
      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Access token is missing");
    });

    it("should successfully unlike a photo and decrement likes_count", async () => {
      // Mock: photo exists
      prismaMock.photos.findUnique.mockResolvedValue({
        id: "10" as any,
        title: "Test Photo",
        likes_count: 6,
      } as any);

      // Mock: like exists
      prismaMock.likes.findUnique.mockResolvedValue({
        user_id: "1" as any,
        photo_id: "10" as any,
      } as any);

      // Mock: like deletion
      prismaMock.likes.delete.mockResolvedValue({} as any);

      // Mock: photo update
      prismaMock.photos.update.mockResolvedValue({
        id: "10" as any,
        likes_count: 5,
        likes: [],
      } as any);

      const res = await request(app)
        .delete(`/api/v1/photos/${photoId}/like`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Photo unliked successfully");
      expect(res.body.data.likes_count).toBe(5);

      expect(prismaMock.photos.findUnique).toHaveBeenCalledWith({
        where: { id: photoId },
      });
      expect(prismaMock.likes.findUnique).toHaveBeenCalledWith({
        where: {
          user_id_photo_id: {
            user_id: "1",
            photo_id: photoId,
          },
        },
      });
      expect(prismaMock.likes.delete).toHaveBeenCalledWith({
        where: {
          user_id_photo_id: {
            user_id: "1",
            photo_id: photoId,
          },
        },
      });
      expect(prismaMock.photos.update).toHaveBeenCalledWith({
        where: { id: photoId },
        data: {
          likes_count: {
            decrement: 1,
          },
        },
        include: {
          likes: {
            select: { user_id: true },
          },
        },
      });
    });

    it("should return 404 Not Found if the photo does not exist", async () => {
      prismaMock.photos.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/v1/photos/${photoId}/like`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Photo not found");
    });

    it("should return 404 Not Found if the user has not liked the photo", async () => {
      // Mock: photo exists
      prismaMock.photos.findUnique.mockResolvedValue({
        id: "10" as any,
        title: "Test Photo",
      } as any);

      // Mock: like does not exist
      prismaMock.likes.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/v1/photos/${photoId}/like`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("You haven't liked this photo");
    });
  });

  describe("GET /api/v1/photos/:id/likes", () => {
    it("should retrieve the list of users who liked the photo", async () => {
      // Mock: photo exists
      prismaMock.photos.findUnique.mockResolvedValue({
        id: "10" as any,
        title: "Test Photo",
      } as any);

      const mockLikes = [
        {
          user_id: "2" as any,
          photo_id: "10" as any,
          users: {
            id: "2" as any,
            username: "likeruser",
            full_name: "Liker User",
            avatar_url: "https://avatar.jpg",
          },
        },
      ];

      // Mock: findMany
      prismaMock.likes.findMany.mockResolvedValue(mockLikes as any);

      // Mock: count
      prismaMock.likes.count.mockResolvedValue(1);

      const res = await request(app)
        .get(`/api/v1/photos/${photoId}/likes?page=1&limit=20`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Likes retrieved successfully");
      expect(res.body.data.users).toHaveLength(1);
      expect(res.body.data.users[0]).toEqual({
        id: "2",
        username: "likeruser",
        full_name: "Liker User",
        avatar_url: "https://avatar.jpg",
      });
      expect(res.body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
      });

      expect(prismaMock.photos.findUnique).toHaveBeenCalledWith({
        where: { id: photoId },
      });
      expect(prismaMock.likes.findMany).toHaveBeenCalledWith({
        where: { photo_id: photoId },
        skip: 0,
        take: 20,
        include: {
          users: {
            select: {
              id: true,
              username: true,
              full_name: true,
              avatar_url: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      });
      expect(prismaMock.likes.count).toHaveBeenCalledWith({
        where: { photo_id: photoId },
      });
    });

    it("should return 404 Not Found if the photo does not exist", async () => {
      prismaMock.photos.findUnique.mockResolvedValue(null);

      const res = await request(app).get(`/api/v1/photos/${photoId}/likes`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Photo not found");
    });
  });
});
