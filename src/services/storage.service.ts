import { supabase } from "../config/supabase";
import { ENV } from "../config/env";

/**
 * Upload an image file to Supabase Storage
 * @param file Multer file object from request
 * @param bucket Storage bucket name (defaults to env configuration)
 * @returns Promise resolving to the public URL of the uploaded image
 */
export async function uploadImageToSupabase(
  file: Express.Multer.File,
  bucket: string = ENV.SUPABASE_STORAGE_BUCKET
): Promise<string> {
  if (!file) {
    throw { status: 400, message: "No file provided for upload" };
  }

  // Get file extension and construct a unique file path
  const fileExt = file.originalname.split(".").pop() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = fileName;

  // Upload file buffer to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) {
    throw {
      status: 500,
      message: `Failed to upload image to Supabase Storage: ${error.message}`,
    };
  }

  // Get the public URL for the uploaded file
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw {
      status: 500,
      message: "Failed to generate public URL for the uploaded photo",
    };
  }

  return publicUrlData.publicUrl;
}
