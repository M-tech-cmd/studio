import type { CloudinaryAsset } from "./types";

/**
 * Unified Cloudinary Upload Worker.
 * Handles the extraction of public_id and resource_type to ensure media permanence.
 */

const CLOUDINARY_CLOUD_NAME = 'dojrqgd3l';
const CLOUDINARY_UPLOAD_URL_BASE = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}`;
const CLOUDINARY_PRESET = 'st_martin_preset';

/**
 * Generates a fresh delivery URL from a public_id.
 * This is the core fix for media "disappearing" - we generate URLs on demand.
 */
export function generateCloudinaryUrl(publicId: string, resourceType: string = 'image'): string {
  if (!publicId) return '';
  if (publicId.startsWith('http')) return publicId; // Legacy support
  
  // f_auto: Automatic format selection (webp/avif)
  // q_auto: Automatic quality optimization
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/f_auto,q_auto/${publicId}`;
}

/**
 * Resolves a media source that could be either a raw URL string or a CloudinaryAsset object.
 */
export function resolveMediaUrl(asset?: string | CloudinaryAsset): string {
    if (!asset) return '';
    if (typeof asset === 'string') return asset;
    return generateCloudinaryUrl(asset.public_id, asset.resource_type);
}

/**
 * Uploads a single file and returns the secure URL string.
 */
export async function uploadSingleFile(storage: any, folder: string, file: File): Promise<string> {
  if (!file) throw new Error('No file provided');

  // 1. Detect Resource Type
  let resourceType = 'auto';
  if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
    resourceType = 'video'; 
  } else if (file.type.startsWith('image/')) {
    resourceType = 'image';
  }

  const uploadUrl = `${CLOUDINARY_UPLOAD_URL_BASE}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_PRESET);
  formData.append('folder', `st_martin/${folder}`);
  formData.append('resource_type', resourceType);

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
    
    // Return the secure URL string directly as requested
    return data.secure_url;
  } catch (error: any) {
    console.error(`[Cloudinary] Sync error for ${file.name}:`, error);
    throw error;
  }
}

/**
 * Uploads multiple files concurrently and returns an array of CloudinaryAsset objects.
 */
export async function uploadMultipleFiles(storage: any, folder: string, files: File[]): Promise<CloudinaryAsset[]> {
  if (!files || files.length === 0) return [];
  
  const uploadPromises = files.map(async (file) => {
      let resourceType = 'auto';
      if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        resourceType = 'video'; 
      } else if (file.type.startsWith('image/')) {
        resourceType = 'image';
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_PRESET);
      formData.append('folder', `st_martin/${folder}`);
      formData.append('resource_type', resourceType);

      const response = await fetch(`${CLOUDINARY_UPLOAD_URL_BASE}/${resourceType}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Bulk upload failed');
      const data = await response.json();
      return {
          public_id: data.public_id,
          resource_type: data.resource_type || resourceType,
          secure_url: data.secure_url
      };
  });

  return Promise.all(uploadPromises);
}
