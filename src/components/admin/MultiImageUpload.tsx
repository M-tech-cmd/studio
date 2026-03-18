'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { ref, getDownloadURL, uploadBytesResumable, type UploadTask } from 'firebase/storage';
import { useStorage } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { MediaItem } from '../shared/MediaItem';

interface MultiImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  folder: string;
  onSyncStatusChange?: (isSyncing: boolean) => void;
}

interface UploadingItem {
  id: string;
  preview: string;
  status: 'syncing' | 'failed';
  file: File;
}

/**
 * ZERO-GHOST INSTANT MULTI-UPLOAD
 * Removed all loading bars and spinners for a pure instant feel.
 */
export function MultiImageUpload({ images, onChange, folder, onSyncStatusChange }: MultiImageUploadProps) {
  const [activeUploads, setActiveUploads] = useState<UploadingItem[]>([]);
  const storage = useRef(useStorage());
  const tasksRef = useRef<Record<string, UploadTask>>({});
  const { toast } = useToast();
  
  const imagesRef = useRef<string[]>(images || []);

  useEffect(() => {
    imagesRef.current = images || [];
  }, [images]);

  useEffect(() => {
    onSyncStatusChange?.(activeUploads.length > 0);
  }, [activeUploads, onSyncStatusChange]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !storage.current) return;

    const selectedFiles = Array.from(files).slice(0, 10);
    
    for (const file of selectedFiles) {
      const id = Math.random().toString(36).substring(7);
      const preview = URL.createObjectURL(file);
      
      const newItem: UploadingItem = { id, preview, status: 'syncing', file };
      setActiveUploads(prev => [...prev, newItem]);

      triggerBackgroundUpload(newItem);
    }

    if (e.target) e.target.value = '';
  };

  const triggerBackgroundUpload = async (item: UploadingItem) => {
    if (!storage.current) return;

    const storageRef = ref(storage.current, `${folder}/${Date.now()}_${item.id}_${item.file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, item.file);
    
    tasksRef.current[item.id] = uploadTask;

    uploadTask.on('state_changed', 
      null, 
      (error) => {
        if (error.code === 'storage/canceled') return;
        setActiveUploads(prev => prev.map(u => u.id === item.id ? { ...u, status: 'failed' } : u));
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const currentList = [...imagesRef.current, downloadURL];
        onChange(currentList);

        setActiveUploads(prev => prev.filter(u => u.id !== item.id));
        delete tasksRef.current[item.id];
        URL.revokeObjectURL(item.preview);
      }
    );
  };

  const removeCloudImage = (index: number) => {
    const next = [...images];
    next.splice(index, 1);
    onChange(next);
  };

  const removePendingUpload = (id: string, preview: string) => {
    if (tasksRef.current[id]) {
        tasksRef.current[id].cancel();
        delete tasksRef.current[id];
    }
    setActiveUploads(prev => prev.filter(u => u.id !== id));
    URL.revokeObjectURL(preview);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="font-black text-xs uppercase tracking-widest text-muted-foreground">Attached Media ({images.length + activeUploads.length})</Label>
        <label className="cursor-pointer">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-[10px] font-black hover:scale-105 transition-all shadow-lg uppercase tracking-widest active:scale-95">
            <Upload className="h-3.5 w-3.5" />
            Add Photos
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