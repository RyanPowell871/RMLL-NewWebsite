import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as db from "./db.tsx";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const BUCKET_NAME = db.IMAGES_BUCKET;

// ============================================
// IMAGE MANAGEMENT ROUTES
// ============================================

// Get all images (with optional filters)
app.get("/images", async (c) => {
  try {
    const { category } = c.req.query();

    const images = await db.getImages(category);

    return c.json({ success: true, images });
  } catch (error) {
    console.error("Error fetching images:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Upload image with metadata
app.post("/upload-image", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const alt_text = formData.get('alt_text') as string;
    const category = formData.get('category') as string;

    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return c.json({ success: false, error: 'File must be an image' }, 400);
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ success: false, error: 'File size must be less than 5MB' }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${timestamp}-${randomString}.${ext}`;

    // Convert File to ArrayBuffer then to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, uint8Array, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading to Supabase Storage:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    // Get public URL
    const file_url = db.getPublicUrl(BUCKET_NAME, filename);

    // Save metadata to database
    const imageData = await db.createImage({
      title: title || file.name,
      alt_text: alt_text || '',
      category: category || 'uncategorized',
      file_url,
      filename,
      file_size: file.size,
      mime_type: file.type,
    });

    console.log(`[Images] Uploaded image: ${imageData.id} - ${imageData.title}`);

    return c.json({ success: true, image: imageData });
  } catch (error) {
    console.error('Error in image upload:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Alias for upload-image (for standard resource URL pattern)
app.post("/images", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const alt_text = formData.get('alt_text') as string;
    const category = formData.get('category') as string;

    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return c.json({ success: false, error: 'File must be an image' }, 400);
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ success: false, error: 'File size must be less than 5MB' }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${timestamp}-${randomString}.${ext}`;

    // Convert File to ArrayBuffer then to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, uint8Array, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading to Supabase Storage:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    // Get public URL
    const file_url = db.getPublicUrl(BUCKET_NAME, filename);

    // Save metadata to database
    const imageData = await db.createImage({
      title: title || file.name,
      alt_text: alt_text || '',
      category: category || 'uncategorized',
      file_url,
      filename,
      file_size: file.size,
      mime_type: file.type,
    });

    console.log(`[Images] Uploaded image: ${imageData.id} - ${imageData.title}`);

    return c.json({ success: true, image: imageData });
  } catch (error) {
    console.error('Error uploading image:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Update image metadata
app.put("/images/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const existingImage = await db.getImageById(id);

    if (!existingImage) {
      return c.json({ success: false, error: "Image not found" }, 404);
    }

    const updatedImage = await db.updateImage(id, body);

    return c.json({ success: true, image: updatedImage });
  } catch (error) {
    console.error("Error updating image:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete image
app.delete("/images/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const image = await db.getImageById(id);

    if (!image) {
      return c.json({ success: false, error: "Image not found" }, 404);
    }

    // Delete from Supabase Storage
    if (image.filename) {
      try {
        await db.deleteFromStorage(BUCKET_NAME, image.filename);
      } catch (e) {
        console.error('Error deleting from storage:', e);
      }
    }

    // Delete metadata from database
    await db.deleteImage(id);

    console.log(`[Images] Deleted image: ${id}`);

    return c.json({ success: true, message: "Image deleted" });
  } catch (error) {
    console.error("Error deleting image:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Delete ALL images (bulk delete)
app.delete("/images", async (c) => {
  try {
    const allImages = await db.getImages();

    if (allImages.length === 0) {
      return c.json({ success: true, message: "No images to delete", deletedCount: 0 });
    }

    // Delete from storage
    const filenames = allImages
      .filter((img: any) => img.filename)
      .map((img: any) => img.filename);

    if (filenames.length > 0) {
      try {
        const sb = supabase;
        const { error } = await sb.storage
          .from(BUCKET_NAME)
          .remove(filenames);

        if (error) {
          console.error('Error deleting from storage:', error);
        }
      } catch (e) {
        console.error('Error deleting from storage:', e);
      }
    }

    // Delete all metadata
    await db.deleteAllImages();

    console.log(`[Images] Bulk deleted ${allImages.length} images`);

    return c.json({ success: true, message: `Deleted ${allImages.length} images`, deletedCount: allImages.length });
  } catch (error) {
    console.error("Error bulk deleting images:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;