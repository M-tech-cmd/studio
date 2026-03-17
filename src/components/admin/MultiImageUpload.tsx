'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, RefreshCcw } from 'lucide-react';
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
  status: 'syncing' | 'failed';
  file: File;
}

/**
 * INSTANT MULTI-UPLOAD (GEMINI METHOD)
 * Features parallel non-blocking workers and immediate UI feedback.
 */
export function MultiImageUpload({ images, onChange, folder }: MultiImageUploadProps) {
  const [activeUploads, setActiveUploads] = useState<UploadingItem[]>([]);
  const storage = useStorage();
  const { toast } = useToast();
  
  // Use ref to maintain the latest list of URLs for the parallel workers to avoid stale closures
  const imagesRef = useRef<string[]>(images || []);

  useEffect(() => {
    imagesRef.current = images || [];
  }, [images]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !storage) return;

    // Hard-cap at 10 to ensure stability and match Gemini behavior
    const selectedFiles = Array.from(files).slice(0, 10);
    if (files.length > 10) {
      toast({ 
        variant: 'destructive', 
        title: 'Limit Exceeded', 
        description: 'Maximum 10 images allowed per batch.' 
      });
    }

    // 1. Instant UI Render
    selectedFiles.forEach(file => {
      const id = Math.random().toString(36).substring(7);
      const preview = URL.createObjectURL(file);
      
      const newItem: UploadingItem = { id, preview, status: 'syncing', file };
      setActiveUploads(prev => [...prev, newItem]);

      // 2. Parallel Background Sync (Non-blocking)
      triggerBackgroundUpload(newItem);
    });

    if (e.target) e.target.value = '';
  };

  const triggerBackgroundUpload = (item: UploadingItem) => {
    if (!storage) return;

    const storageRef = ref(storage, `${folder}/${Date.now()}_${item.id}_${item.file.name}`);
    
    // Using uploadBytes (faster for multi-batches) with a 60s fail-safe race
    const uploadPromise = uploadBytes(storageRef, item.file);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Sync Timeout')), 60000)
    );

    Promise.race([uploadPromise, timeoutPromise])
      .then(async (snapshot: any) => {
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        // 3. Silent State Swap
        // Get the latest images from ref to ensure we don't drop other parallel uploads
        const currentList = [...imagesRef.current, downloadURL];
        onChange(currentList);

        // Cleanup local UI item and memory
        setActiveUploads(prev => prev.filter(u => u.id !== item.id));
        setTimeout(() => URL.revokeObjectURL(item.preview), 5000);
      })
      .catch((error) => {
        console.error(`Sync worker ${item.id} failed:`, error);
        setActiveUploads(prev => prev.map(u => 
          u.id === item.id ? { ...u, status: 'failed' } : u
        ));
        toast({ 
          variant: 'destructive', 
          title: 'Sync Interrupted', 
          description: `Failed to upload ${item.file.name}` 
        });
      });
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
          <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Instant Gallery Sync</Label>
          <p className="text-[9px] text-muted-foreground italic">Parallel background workers active.</p>
        </div>
        <div className="flex items-center gap-3">
          {activeUploads.length > 0 && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
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
        {/* Cloud Images (Finished) */}
        {images.map((url, index) => (
          <MediaItem 
            key={`cloud-${index}-${url}`} 
            url={url} 
            onRemove={() => removeCloudImage(index)} 
          />
        ))}

        {/* Instant Previews (Syncing) */}
        {activeUploads.map((item) => (
          <div key={item.id} className="relative group isolate">
            <MediaItem 
              url={item.preview} 
              isError={item.status === 'failed'}
              onRemove={() => removePendingUpload(item.id, item.preview)} 
            />
            
            {item.status === 'syncing' && (
                <div className="absolute bottom-2 left-2 z-20">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-tighter animate-pulse">
                        Syncing...
                    </span>
                </div>
            )}

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
