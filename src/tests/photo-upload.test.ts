import request from "supertest";
import app from "../app";
import { prismaMock } from "./setup";
import { generateAccessToken } from "../services/token.service";
import * as storageService from "../services/storage.service";

// Mock the storage service to prevent real network uploads
jest.mock("../services/storage.service", () => ({
  uploadImageToSupabase: jest.fn().mockResolvedValue("https://supabase.co/mock-image.jpg"),
}));

describe("Photo Upload API", () => {
  const userToken = generateAccessToken({
    userId: "1" as any,
    email: "user@example.com",
    role: "user",
  });

  describe("POST /api/v1/photos", () => {
    it("should return 401 Unauthorized if no token is provided", async () => {
      const res = await request(app)
        .post("/api/v1/photos")
        .attach("image", Buffer.from("fake-image-data"), "test.jpg")
        .field("title", "Sunset");

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Access token is missing");
    });

    it("should return 400 Bad Request if no image file is uploaded", async () => {
      const res = await request(app)
        .post("/api/v1/photos")
        .set("Authorization", `Bearer ${userToken}`)
        .field("title", "No Image Photo")
        .field("description", "Description without image");

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation error");
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "image",
            message: "Image file is required",
          }),
        ])
      );
    });

    it("should return 400 Bad Request if title is missing", async () => {
      const res = await request(app)
        .post("/api/v1/photos")
        .set("Authorization", `Bearer ${userToken}`)
        .attach("image", Buffer.from("fake-image-data"), "test.jpg")
        .field("description", "Missing title description");

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation error");
      // Joi validation handles title missing
      expect(res.body.details[0].field).toBe("title");
    });

    it("should successfully upload the image and save the photo to the database", async () => {
      const mockPhotoId = "100" as any;

      // Mock database insertion and detailed fetch
      prismaMock.photos.create.mockResolvedValue({
        id: mockPhotoId,
        title: "Beautiful Sunset",
        description: "Beach sunset image",
        image_url: "https://supabase.co/mock-image.jpg",
        user_id: "1" as any,
        status: "pending",
      });

      // Mock tags find/create
      prismaMock.tags.findUnique
        .mockResolvedValueOnce({ id: "10" as any, name: "sunset" })
        .mockResolvedValueOnce(null); // beach is new

      prismaMock.tags.create.mockResolvedValue({ id: "11" as any, name: "beach" });
      prismaMock.photo_tags.upsert.mockResolvedValue({} as any);

      prismaMock.photos.findUnique.mockResolvedValue({
        id: mockPhotoId,
        title: "Beautiful Sunset",
        description: "Beach sunset image",
        image_url: "https://supabase.co/mock-image.jpg",
        user_id: "1" as any,
        status: "pending",
        users: {
          id: "1" as any,
          username: "johndoe",
          full_name: "John Doe",
          avatar_url: null,
        },
        photo_tags: [
          { tags: { id: "10" as any, name: "sunset" } } as any,
          { tags: { id: "11" as any, name: "beach" } } as any,
        ],
        comments: [],
        likes: [],
      } as any);

      const res = await request(app)
        .post("/api/v1/photos")
        .set("Authorization", `Bearer ${userToken}`)
        .attach("image", Buffer.from("fake-image-data"), "test.jpg")
        .field("title", "Beautiful Sunset")
        .field("description", "Beach sunset image")
        .field("tags", '["sunset", "beach"]');

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Photo created successfully");
      expect(res.body.data.photo).toBeDefined();
      expect(res.body.data.photo.title).toBe("Beautiful Sunset");
      expect(res.body.data.photo.image_url).toBe("https://supabase.co/mock-image.jpg");
      
      // Verify storage service was called
      expect(storageService.uploadImageToSupabase).toHaveBeenCalled();
    });
  });
});
