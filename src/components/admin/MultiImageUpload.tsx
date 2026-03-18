'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, RefreshCcw } from 'lucide-react';
import { ref, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
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
  status: 'syncing' | 'failed';
  progress: number;
  file: File;
}

/**
 * TRANSPARENT INSTANT MULTI-UPLOAD
 * Features parallel background workers with ZERO visual blockers.
 * Images appear instantly at 100% quality with no spinners or overlays.
 */
export function MultiImageUpload({ images, onChange, folder }: MultiImageUploadProps) {
  const [activeUploads, setActiveUploads] = useState<UploadingItem[]>([]);
  const storage = useStorage();
  const { toast } = useToast();
  
  const imagesRef = useRef<string[]>(images || []);

  useEffect(() => {
    imagesRef.current = images || [];
  }, [images]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !storage) return;

    const selectedFiles = Array.from(files).slice(0, 10);
    if (files.length > 10) {
      toast({ 
        variant: 'destructive', 
        title: 'Limit Exceeded', 
        description: 'Maximum 10 images allowed per batch.' 
      });
    }

    selectedFiles.forEach(file => {
      const id = Math.random().toString(36).substring(7);
      const preview = URL.createObjectURL(file);
      
      const newItem: UploadingItem = { id, preview, status: 'syncing', progress: 0, file };
      setActiveUploads(prev => [...prev, newItem]);

      triggerBackgroundUpload(newItem);
    });

    if (e.target) e.target.value = '';
  };

  const triggerBackgroundUpload = (item: UploadingItem) => {
    if (!storage) return;

    const storageRef = ref(storage, `${folder}/${Date.now()}_${item.id}_${item.file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, item.file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setActiveUploads(prev => prev.map(u => 
          u.id === item.id ? { ...u, progress } : u
        ));
      },
      (error) => {
        console.error(`Sync worker ${item.id} failed:`, error.message);
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
          console.error("URL retrieval failed:", err);
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
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl border border-dashed border-primary/20">
        <div className="space-y-1">
          <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Gallery Synchronization</Label>
          <p className="text-[9px] text-muted-foreground italic">Background workers processing selected media.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full text-[10px] font-black hover:scale-105 transition-all shadow-lg uppercase tracking-widest active:scale-95">
              <Upload className="h-3.5 w-3.5" />
              Select Media
            </div>
            <input type="file" multiple className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {/* Persistent Cloud Media */}
        {images.map((url, index) => (
          <MediaItem 
            key={`cloud-${index}-${url}`} 
            url={url} 
            onRemove={() => removeCloudImage(index)} 
          />
        ))}

        {/* Instant Local Previews (Syncing invisibly in background) */}
        {activeUploads.map((item) => (
          <div key={item.id} className="relative group isolate">
            <MediaItem 
              url={item.preview} 
              isError={item.status === 'failed'}
              onRemove={() => removePendingUpload(item.id, item.preview)} 
            />
            
            {/* NO SYNC OVERLAYS - Image remains 100% visible */}

            {item.status === 'failed' && (
              <button
                type="button"
                onClick={() => triggerBackgroundUpload(item)}
                className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-destructive/60 backdrop-blur-[2px] rounded-2xl transition-all hover:bg-destructive/80"
              >
                <RefreshCcw className="h-8 w-8 text-white mb-2" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Retry Sync</span>
              </button>
            )}
          </div>
        ))}

        {images.length === 0 && activeUploads.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground/40 bg-muted/5 border-2 border-dashed rounded-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Media Attached</p>
          </div>
        )}
      </div>
    </div>
  );
}
