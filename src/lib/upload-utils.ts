/**
 * Unified Cloudinary Upload Worker.
 * Replaces Firebase Storage logic to bypass billing errors and support multi-modal media.
 * Uses the 'auto' resource type to handle Image, Video, and Audio concurrently.
 */

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dojrqgd3l/auto/upload';
const CLOUDINARY_PRESET = 'st_martin_preset';

export async function uploadSingleFile(storage: any, folder: string, file: File): Promise<string> {
  if (!file) return '';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_PRESET);
  formData.append('folder', `st_martin/${folder}`);

  console.log(`[Cloudinary] Starting upload for: ${file.name} to ${folder}`);

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Cloudinary upload failed');
    }

    const data = await response.json();
    console.log(`[Cloudinary] Upload success: ${data.secure_url}`);
    return data.secure_url;
  } catch (error: any) {
    console.error(`[Cloudinary] Sync error for ${file.name}:`, error);
    throw error;
  }
}

/**
 * Uploads multiple files concurrently using Cloudinary's API.
 */
export async function uploadMultipleFiles(storage: any, folder: string, files: File[]): Promise<string[]> {
  if (!files || files.length === 0) return [];
  console.log(`[Cloudinary] Batch sync initiated for ${files.length} assets`);
  
  const uploadPromises = files.map(file => uploadSingleFile(null, folder, file));
  return Promise.all(uploadPromises);
}
