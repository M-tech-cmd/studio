/**
 * Unified Cloudinary Upload Worker.
 * Replaces Firebase Storage logic to bypass billing errors and support multi-modal media.
 * Uses intelligent resource_type detection to handle Image, Video, and Audio.
 */

const CLOUDINARY_UPLOAD_URL_BASE = 'https://api.cloudinary.com/v1_1/dojrqgd3l';
const CLOUDINARY_PRESET = 'st_martin_preset';

export async function uploadSingleFile(storage: any, folder: string, file: File): Promise<string> {
  if (!file) return '';

  // 1. Detect Resource Type
  let resourceType = 'auto';
  if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
    resourceType = 'video'; // Cloudinary uses 'video' for both video and audio
  } else if (file.type.startsWith('image/')) {
    resourceType = 'image';
  }

  const uploadUrl = `${CLOUDINARY_UPLOAD_URL_BASE}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_PRESET);
  formData.append('folder', `st_martin/${folder}`);
  formData.append('resource_type', resourceType);

  console.log(`[Cloudinary] Starting ${resourceType} upload for: ${file.name} to ${folder}`);

  try {
    const response = await fetch(uploadUrl, {
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
