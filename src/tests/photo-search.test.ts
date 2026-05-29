import { createPhotoWithTags } from "../services/photo.service";
import { searchPhotos } from "../services/search.service";
import { prismaMock } from "./setup";

describe("Photo & Search Services", () => {
  describe("createPhotoWithTags", () => {
    const photoData = {
      title: "Nature sunset",
      description: "A beautiful sunset view",
      image_url: "https://example.com/sunset.jpg",
      user_id: BigInt(1),
      tags: ["nature", "sunset"],
    };

    it("should create a photo with status pending and assign tags", async () => {
      // Mock: photo creation
      prismaMock.photos.create.mockResolvedValue({
        id: BigInt(1),
        title: photoData.title,
        description: photoData.description,
        image_url: photoData.image_url,
        user_id: photoData.user_id,
        status: "pending",
      });

      // Mock: tag lookup and creation
      prismaMock.tags.findUnique
        .mockResolvedValueOnce({ id: BigInt(10), name: "nature" })
        .mockResolvedValueOnce(null); // sunset is new

      prismaMock.tags.create.mockResolvedValue({ id: BigInt(11), name: "sunset" });

      // Mock: assign tags
      prismaMock.photo_tags.upsert.mockResolvedValue({} as any);

      // Mock: getPhotoWithDetails calls
      prismaMock.photos.findUnique.mockResolvedValue({
        id: BigInt(1),
        title: photoData.title,
        description: photoData.description,
        image_url: photoData.image_url,
        user_id: photoData.user_id,
        status: "pending",
        users: {
          id: BigInt(1),
          username: "johndoe",
          full_name: "John Doe",
          avatar_url: null,
        },
        photo_tags: [
          { tags: { id: BigInt(10), name: "nature" } },
          { tags: { id: BigInt(11), name: "sunset" } },
        ],
        comments: [],
        likes: [],
      });

      const photo = await createPhotoWithTags(photoData);

      expect(photo).not.toBeNull();
      expect(photo?.status).toBe("pending");

      // Verify that status: "pending" was passed to prisma.photos.create
      expect(prismaMock.photos.create).toHaveBeenCalledWith({
        data: {
          title: photoData.title,
          description: photoData.description,
          image_url: photoData.image_url,
          user_id: photoData.user_id,
          status: "pending",
        },
      });

      expect(prismaMock.tags.findUnique).toHaveBeenCalledTimes(2);
      expect(prismaMock.tags.create).toHaveBeenCalledTimes(1); // Only for sunset
    });
  });

  describe("searchPhotos", () => {
    it("should construct OR query with title, description, tags, and user profile fields", async () => {
      prismaMock.photos.findMany.mockResolvedValue([]);
      prismaMock.photos.count.mockResolvedValue(0);

      await searchPhotos("sunset", 0, 10);

      expect(prismaMock.photos.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "approved",
            OR: expect.arrayContaining([
              expect.objectContaining({
                title: { contains: "sunset", mode: "insensitive" },
              }),
              expect.objectContaining({
                description: { contains: "sunset", mode: "insensitive" },
              }),
              expect.objectContaining({
                photo_tags: {
                  some: {
                    tags: {
                      name: { contains: "sunset", mode: "insensitive" },
                    },
                  },
                },
              }),
              expect.objectContaining({
                users: {
                  OR: [
                    { username: { contains: "sunset", mode: "insensitive" } },
                    { full_name: { contains: "sunset", mode: "insensitive" } },
                  ],
                },
              }),
            ]),
          }),
        }),
      );
    });
  });
});
