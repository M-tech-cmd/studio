'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import { useStorage } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { MediaItem } from '../shared/MediaItem';

interface MultiImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  folder: string;
}

interface UploadingItem {
  id: string;
  preview: string;
  file: File;
}

/**
 * Standardized Atomic Multi-Image Upload.
 * Uses uploadBytes for single-pass reliability.
 * No blocking state - allows user to save form while uploads run.
 */
export function MultiImageUpload({ images, onChange, folder }: MultiImageUploadProps) {
  const [activeUploads, setActiveUploads] = useState<UploadingItem[]>([]);
  const storage = useStorage();
  const { toast } = useToast();
  const imagesRef = useRef<string[]>(images || []);

  useEffect(() => {
    imagesRef.current = images || [];
  }, [images]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !storage) return;

    const selectedFiles = Array.from(files).slice(0, 10);
    
    for (const file of selectedFiles) {
      const id = Math.random().toString(36).substring(7);
      const preview = URL.createObjectURL(file);
      
      const newItem: UploadingItem = { id, preview, file };
      setActiveUploads(prev => [...prev, newItem]);

      // Silent Atomic Sync
      triggerBackgroundUpload(newItem);
    }

    if (e.target) e.target.value = '';
  };

  const triggerBackgroundUpload = async (item: UploadingItem) => {
    if (!storage) return;

    try {
      const storageRef = ref(storage, `${folder}/${Date.now()}_${item.id}_${item.file.name}`);
      // Single attempt, no retry pattern
      const snapshot = await uploadBytes(storageRef, item.file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const currentList = [...imagesRef.current, downloadURL];
      onChange(currentList);

      setActiveUploads(prev => prev.filter(u => u.id !== item.id));
      URL.revokeObjectURL(item.preview);
    } catch (error: any) {
      console.error("Atomic upload failed:", error.code);
      toast({ variant: 'destructive', title: 'Upload Error', description: 'One or more items could not be synced.' });
      setActiveUploads(prev => prev.filter(u => u.id !== item.id));
    }
  };

  const removeCloudImage = (index: number) => {
    const next = [...images];
    next.splice(index, 1);
    onChange(next);
  };

  const removePendingUpload = (id: string, preview: string) => {
    setActiveUploads(prev => prev.filter(u => u.id !== id));
    URL.revokeObjectURL(preview);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="font-black text-xs uppercase tracking-widest text-muted-foreground">Gallery Media ({images.length + activeUploads.length})</Label>
        <label className="cursor-pointer">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-[10px] font-black hover:scale-105 transition-all shadow-lg uppercase tracking-widest active:scale-95">
            <Upload className="h-3.5 w-3.5" />
            Add Media
          </div>
          <input type="file" multiple className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((url, index) => (
          <MediaItem 
            key={`cloud-${index}`} 
            url={url} 
            onRemove={() => removeCloudImage(index)} 
          />
        ))}

        {activeUploads.map((item) => (
          <MediaItem 
            key={item.id}
            url={item.preview} 
            onRemove={() => removePendingUpload(item.id, item.preview)} 
          />
        ))}

        {images.length === 0 && activeUploads.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground/40 bg-muted/5 border-2 border-dashed rounded-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Media Selected</p>
          </div>
        )}
      </div>
    </div>
  );
}
