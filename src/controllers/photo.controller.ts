import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";

export async function getAllPhotos(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const photos = await prisma.photos.findMany({
      orderBy: { created_at: "desc" },
    });
    res.status(200).json(photos);
  } catch (error) {
    next(error);
  }
}

export async function getPhotoById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const photo = await prisma.photos.findUnique({
      where: { photo_id: BigInt(id as string) },
    });

    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    res.status(200).json(photo);
  } catch (error) {
    next(error);
  }
}

export async function createPhoto(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { title, url, description } = req.body;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    const photo = await prisma.photos.create({
      data: {
        title: title || null,
        url,
        description: description || null,
      },
    });

    res.status(201).json(photo);
  } catch (error) {
    next(error);
  }
}

export async function updatePhoto(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const { title, url, description } = req.body;

    const existingPhoto = await prisma.photos.findUnique({
      where: { photo_id: BigInt(id as string) },
    });

    if (!existingPhoto) {
      return res.status(404).json({ message: "Photo not found" });
    }

    const photo = await prisma.photos.update({
      where: { photo_id: BigInt(id as string) },
      data: {
        title: title !== undefined ? title : existingPhoto.title,
        url: url || existingPhoto.url,
        description:
          description !== undefined ? description : existingPhoto.description,
      },
    });

    res.status(200).json(photo);
  } catch (error) {
    next(error);
  }
}

export async function deletePhoto(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;

    const existingPhoto = await prisma.photos.findUnique({
      where: { photo_id: BigInt(id as string) },
    });

    if (!existingPhoto) {
      return res.status(404).json({ message: "Photo not found" });
    }

    await prisma.photos.delete({
      where: { photo_id: BigInt(id as string) },
    });

    res.status(200).json({ message: "Photo deleted successfully" });
  } catch (error) {
    next(error);
  }
}
