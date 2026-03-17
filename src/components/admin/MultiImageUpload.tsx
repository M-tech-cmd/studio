'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Loader2 } from 'lucide-react';
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
  progress: number;
  status: 'pending' | 'syncing' | 'failed';
}

/**
 * INSTANT MULTI-UPLOAD SYSTEM
 * Refactored to eliminate blocking "Syncing" overlays. 
 * Renders local previews immediately and handles Cloud sync in the background.
 */
export function MultiImageUpload({ images, onChange, folder }: MultiImageUploadProps) {
  // Source of truth for existing cloud images
  const [activeUploads, setActiveUploads] = useState<UploadingItem[]>([]);
  const storage = useStorage();
  const { toast } = useToast();
  
  // Registry to track object URLs for cleanup
  const objectUrlRegistry = useRef<Set<string>>(new Set());

  // Ref to track latest images to avoid closure traps during background updates
  const imagesRef = useRef<string[]>(images || []);
  useEffect(() => {
    imagesRef.current = images || [];
  }, [images]);

  // Memory Cleanup on Unmount
  useEffect(() => {
    return () => {
      objectUrlRegistry.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // 1. INSTANT PREVIEW GENERATION
    const newItems: UploadingItem[] = selectedFiles.map(file => {
      const preview = URL.createObjectURL(file);
      objectUrlRegistry.current.add(preview);
      return {
        id: Math.random().toString(36).substring(7),
        preview,
        progress: 0,
        status: 'pending',
        file // Attach file temporarily for the worker
      } as any;
    });

    // Add previews to local state immediately
    setActiveUploads(prev => [...prev, ...newItems]);

    // 2. TRIGGER BACKGROUND WORKERS
    newItems.forEach(item => {
      uploadWorker(item as any);
    });

    if (e.target) e.target.value = '';
  };

  /**
   * Background worker using uploadBytesResumable.
   * Runs independently for each file without blocking the UI.
   */
  const uploadWorker = async (item: UploadingItem & { file: File }) => {
    const storageRef = ref(storage, `${folder}/${Date.now()}_${item.id}_${item.file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, item.file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        // Subtle progress update
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setActiveUploads(prev => prev.map(u => 
          u.id === item.id ? { ...u, progress, status: 'syncing' } : u
        ));
      },
      (error) => {
        console.error(`Sync failed for ${item.id}:`, error);
        setActiveUploads(prev => prev.map(u => 
          u.id === item.id ? { ...u, status: 'failed' } : u
        ));
        toast({ variant: 'destructive', title: 'Upload Failed', description: item.file.name });
      },
      async () => {
        // SUCCESS: Final URL replacement
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Update parent state (Firestore)
          const updatedImages = [...imagesRef.current, downloadURL];
          onChange(updatedImages);

          // Remove from local "active" list and cleanup memory
          setActiveUploads(prev => prev.filter(u => u.id !== item.id));
          URL.revokeObjectURL(item.preview);
          objectUrlRegistry.current.delete(item.preview);
        } catch (err) {
          setActiveUploads(prev => prev.map(u => u.id === item.id ? { ...u, status: 'failed' } : u));
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
    objectUrlRegistry.current.delete(preview);
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl border border-dashed border-primary/20">
        <div className="space-y-1">
          <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Gallery Media</Label>
          <p className="text-[9px] text-muted-foreground italic">Instant preview enabled • Parallel background sync.</p>
        </div>
        <div className="flex items-center gap-3">
          {activeUploads.length > 0 && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] text-white rounded-full text-[10px] font-black hover:bg-[#1e3a5f]/90 transition-all shadow-lg uppercase tracking-widest active:scale-95">
              <Upload className="h-3.5 w-3.5" />
              Add Photos
            </div>
            <input type="file" multiple className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {/* 1. RENDER EXISTING CLOUD IMAGES */}
        {images.map((url, index) => (
          <MediaItem 
            key={`cloud-${url}-${index}`} 
            url={url} 
            onRemove={() => removeCloudImage(index)} 
          />
        ))}

        {/* 2. RENDER ACTIVE UPLOADS (Instant Previews) */}
        {activeUploads.map((item) => (
          <MediaItem 
            key={`pending-${item.id}`} 
            url={item.preview} 
            isLoading={item.status === 'syncing' || item.status === 'pending'} 
            isError={item.status === 'failed'}
            progress={item.progress}
            onRemove={() => removePendingUpload(item.id, item.preview)} 
          />
        ))}

        {images.length === 0 && activeUploads.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground/40 bg-muted/5 border-2 border-dashed rounded-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Gallery Empty</p>
          </div>
        )}
      </div>
    </div>
  );
}
