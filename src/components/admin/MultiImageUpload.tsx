
'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, RefreshCcw, X, Loader2 } from 'lucide-react';
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
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
 * PRODUCTION-GRADE ATOMIC MULTI-UPLOAD
 * - Uses uploadBytes to prevent retry-limit-exceeded deadlocks.
 * - Instant local previews for zero-latency UX.
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !storage) return;

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
    if (!storage) return;

    const storageRef = ref(storage, `${folder}/${Date.now()}_${item.id}_${item.file.name}`);
    
    try {
      // Atomic upload: Faster and prevents the resumable stream retry deadlock
      const snapshot = await uploadBytes(storageRef, item.file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const currentList = [...imagesRef.current, downloadURL];
      onChange(currentList);

      setActiveUploads(prev => prev.filter(u => u.id !== item.id));
      // Delay revocation to allow browser to swap URLs smoothly
      setTimeout(() => URL.revokeObjectURL(item.preview), 5000);
    } catch (error: any) {
      console.error("Sync worker failed:", error);
      setActiveUploads(prev => prev.map(u => 
        u.id === item.id ? { ...u, status: 'failed' } : u
      ));
      toast({ 
        variant: 'destructive', 
        title: 'Sync Interrupted', 
        description: `Failed to upload ${item.file.name}. Click retry to try again.` 
      });
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
        <Label className="font-black text-xs uppercase tracking-widest text-muted-foreground">Attached Media ({images.length})</Label>
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
            
            {item.status === 'syncing' && (
              <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/10 backdrop-blur-[1px] rounded-2xl">
                <div className="bg-white/90 p-2 rounded-full shadow-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              </div>
            )}

            {item.status === 'failed' && (
              <button
                type="button"
                onClick={() => triggerBackgroundUpload(item)}
                className="absolute inset-0 flex flex-col items-center justify-center z-[70] bg-destructive/60 backdrop-blur-[2px] rounded-2xl transition-all hover:bg-destructive/80"
              >
                <RefreshCcw className="h-8 w-8 text-white mb-2" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Retry Sync</span>
              </button>
            )}
          </div>
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
