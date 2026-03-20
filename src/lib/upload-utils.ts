import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';

/**
 * Uploads a single file to Firebase Storage using atomic uploadBytes.
 * This prevents infinite retry loops and network starvation.
 */
export async function uploadSingleFile(storage: FirebaseStorage, folder: string, file: File): Promise<string> {
  if (!file) return '';
  
  // Use a unique filename to prevent collisions and caching issues
  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const storageRef = ref(storage, `${folder}/${fileName}`);
  
  console.log(`[Upload] Starting atomic sync: ${fileName}`);
  
  try {
    // Atomic upload: single pass, no resumable overhead
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    console.log(`[Upload] Sync complete: ${url}`);
    return url;
  } catch (error: any) {
    console.error(`[Upload] Atomic sync failed: ${file.name}`, error.code);
    throw error;
  }
}

/**
 * Uploads multiple files concurrently using Promise.all.
 */
export async function uploadMultipleFiles(storage: FirebaseStorage, folder: string, files: File[]): Promise<string[]> {
  if (!files || files.length === 0) return [];
  console.log(`[Upload] Batch sync initiated for ${files.length} assets`);
  
  // Launch all uploads in parallel for maximum efficiency
  const uploadPromises = files.map(file => uploadSingleFile(storage, folder, file));
  return Promise.all(uploadPromises);
}
