import { ref, uploadBytesResumable, getDownloadURL, FirebaseStorage } from 'firebase/storage';

/**
 * Uploads a single file to Firebase Storage using direct resumable sync.
 * This is more resilient to environment-specific disconnects.
 */
export async function uploadSingleFile(storage: FirebaseStorage, folder: string, file: File): Promise<string> {
  if (!file) return '';
  
  // Enforce rigid path: uploads/{category}/{filename}
  const category = folder.replace(/^uploads\//, '').replace(/-/g, '_');
  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const storagePath = `uploads/${category}/${fileName}`;
  const storageRef = ref(storage, storagePath);
  
  console.log(`[Upload] Resumable sync started: ${storagePath}`);
  
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      null, // Silent progress per instructions
      (error) => {
        console.error(`[Upload] Resumable sync failed for: ${file.name}`, error);
        reject(error);
      }, 
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          console.log(`[Upload] Sync complete: ${url}`);
          resolve(url);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Uploads multiple files concurrently using Promise.all.
 */
export async function uploadMultipleFiles(storage: FirebaseStorage, folder: string, files: File[]): Promise<string[]> {
  if (!files || files.length === 0) return [];
  console.log(`[Upload] Batch sync initiated for ${files.length} assets`);
  
  const uploadPromises = files.map(file => uploadSingleFile(storage, folder, file));
  return Promise.all(uploadPromises);
}
