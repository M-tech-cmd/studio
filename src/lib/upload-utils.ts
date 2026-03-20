import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';

/**
 * Uploads a single file to Firebase Storage and returns the download URL.
 */
export async function uploadSingleFile(storage: FirebaseStorage, folder: string, file: File): Promise<string> {
  if (!file) return '';
  console.log(`[Upload] Starting single file upload: ${file.name} to ${folder}`);
  const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  console.log(`[Upload] Finished: ${file.name} -> ${url}`);
  return url;
}

/**
 * Uploads multiple files concurrently using Promise.all.
 */
export async function uploadMultipleFiles(storage: FirebaseStorage, folder: string, files: File[]): Promise<string[]> {
  if (!files || files.length === 0) return [];
  console.log(`[Upload] Starting batch upload of ${files.length} files to ${folder}`);
  const uploadPromises = files.map(file => uploadSingleFile(storage, folder, file));
  const urls = await Promise.all(uploadPromises);
  console.log(`[Upload] Batch upload complete. ${urls.length} URLs generated.`);
  return urls;
}
