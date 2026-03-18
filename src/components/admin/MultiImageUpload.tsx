'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, RefreshCcw, X } from 'lucide-react';
import { ref, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
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
  progress: number;
  file: File;
}

/**
 * PRODUCTION-GRADE INSTANT MULTI-UPLOAD (NON-BLOCKING)
 * - Zero visual noise: No "Syncing" headers or overlays.
 * - Background persistence: Uploads continue independently.
 */
export function MultiImageUpload({ images, onChange, folder, onSyncStatusChange }: MultiImageUploadProps) {
  const [activeUploads, setActiveUploads] = useState<UploadingItem[]>([]);
  const storage = useStorage();
  const { toast } = useToast();
  
  const imagesRef = useRef<string[]>(images || []);

  useEffect(() => {
    imagesRef.current = images || [];
  }, [images]);

  useEffect(() => {
    onSyncStatusChange?.(activeUploads.length > 0);
  }, [activeUploads, onSyncStatusChange]);

  const compressImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/') || file.size < 1024 * 1024) return file;
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1200;
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            else resolve(file);
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !storage) return;

    const selectedFiles = Array.from(files).slice(0, 10);
    
    for (const file of selectedFiles) {
      const id = Math.random().toString(36).substring(7);
      const preview = URL.createObjectURL(file);
      
      const newItem: UploadingItem = { id, preview, status: 'syncing', progress: 0, file };
      setActiveUploads(prev => [...prev, newItem]);

      const compressed = await compressImage(file);
      triggerBackgroundUpload({ ...newItem, file: compressed });
    }

    if (e.target) e.target.value = '';
  };

  const triggerBackgroundUpload = (item: UploadingItem, retryCount = 0) => {
    if (!storage) return;

    const storageRef = ref(storage, `${folder}/${Date.now()}_${item.id}_${item.file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, item.file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setActiveUploads(prev => prev.map(u => 
          u.id === item.id ? { ...u, progress, status: 'syncing' } : u
        ));
      },
      (error) => {
        if (error.code === 'storage/retry-limit-exceeded' && retryCount < 1) {
          triggerBackgroundUpload(item, retryCount + 1);
          return;
        }

        setActiveUploads(prev => prev.map(u => 
          u.id === item.id ? { ...u, status: 'failed' } : u
        ));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const currentList = [...imagesRef.current, downloadURL];
          onChange(currentList);

          setActiveUploads(prev => prev.filter(u => u.id !== item.id));
          setTimeout(() => URL.revokeObjectURL(item.preview), 5000);
        } catch (err: any) {
          setActiveUploads(prev => prev.map(u => 
            u.id === item.id ? { ...u, status: 'failed' } : u
          ));
        }
      }
    );
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
        <Label className="font-black text-xs uppercase tracking-widest text-muted-foreground">Attached Photos ({images.length})</Label>
        <label className="cursor-pointer">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-[10px] font-black hover:scale-105 transition-all shadow-lg uppercase tracking-widest active:scale-95">
            <Upload className="h-3.5 w-3.5" />
            Add Images
          </div>
          <input type="file" multiple className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((url, index) => (
          <MediaItem 
            key={`cloud-${index}-${url}`} 
            url={url} 
            onRemove={() => removeCloudImage(index)} 
          />
        ))}

        {activeUploads.map((item) => (
          <div key={item.id} className="relative group isolate">
            <MediaItem 
              url={item.preview} 
              isError={item.status === 'failed'}
              onRemove={() => removePendingUpload(item.id, item.preview)} 
            />
            
            {item.status === 'failed' && (
              <button
                type="button"
                onClick={() => triggerBackgroundUpload(item)}
                className="absolute inset-0 flex flex-col items-center justify-center z-[70] bg-destructive/60 backdrop-blur-[2px] rounded-2xl transition-all hover:bg-destructive/80"
              >
                <RefreshCcw className="h-8 w-8 text-white mb-2" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Retry</span>
              </button>
            )}
          </div>
        ))}

        {images.length === 0 && activeUploads.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground/40 bg-muted/5 border-2 border-dashed rounded-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Photos Selected</p>
          </div>
        )}
      </div>
    </div>
  );
}
