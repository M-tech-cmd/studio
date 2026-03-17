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
  status: 'pending' | 'syncing' | 'failed';
}

/**
 * INSTANT MULTI-UPLOAD SYSTEM
 * Refactored to eliminate ALL blocking UI elements.
 * Images render immediately at 100% visibility.
 */
export function MultiImageUpload({ images, onChange, folder }: MultiImageUploadProps) {
  const [activeUploads, setActiveUploads] = useState<UploadingItem[]>([]);
  const storage = useStorage();
  const { toast } = useToast();
  
  const objectUrlRegistry = useRef<Set<string>>(new Set());
  const imagesRef = useRef<string[]>(images || []);

  useEffect(() => {
    imagesRef.current = images || [];
  }, [images]);

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

    const newItems: UploadingItem[] = selectedFiles.map(file => {
      const preview = URL.createObjectURL(file);
      objectUrlRegistry.current.add(preview);
      return {
        id: Math.random().toString(36).substring(7),
        preview,
        status: 'pending',
        file
      } as any;
    });

    setActiveUploads(prev => [...prev, ...newItems]);

    newItems.forEach(item => {
      uploadWorker(item as any);
    });

    if (e.target) e.target.value = '';
  };

  const uploadWorker = async (item: UploadingItem & { file: File }) => {
    const storageRef = ref(storage, `${folder}/${Date.now()}_${item.id}_${item.file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, item.file);

    uploadTask.on('state_changed', 
      null, // No visual progress needed per user request
      (error) => {
        console.error(`Sync failed for ${item.id}:`, error);
        setActiveUploads(prev => prev.map(u => 
          u.id === item.id ? { ...u, status: 'failed' } : u
        ));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const updatedImages = [...imagesRef.current, downloadURL];
          onChange(updatedImages);

          setActiveUploads(prev => prev.filter(u => u.id !== item.id));
          // Keep ObjectURL alive for a few seconds to avoid flicker during state hydration
          setTimeout(() => {
            URL.revokeObjectURL(item.preview);
            objectUrlRegistry.current.delete(item.preview);
          }, 3000);
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
          <p className="text-[9px] text-muted-foreground italic">Instant upload UX active.</p>
        </div>
        <div className="flex items-center gap-3">
          {activeUploads.length > 0 && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full text-[10px] font-black hover:scale-105 transition-all shadow-lg uppercase tracking-widest active:scale-95">
              <Upload className="h-3.5 w-3.5" />
              Add Photos
            </div>
            <input type="file" multiple className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((url, index) => (
          <MediaItem 
            key={`cloud-${url}-${index}`} 
            url={url} 
            onRemove={() => removeCloudImage(index)} 
          />
        ))}

        {activeUploads.map((item) => (
          <MediaItem 
            key={`pending-${item.id}`} 
            url={item.preview} 
            isError={item.status === 'failed'}
            onRemove={() => removePendingUpload(item.id, item.preview)} 
          />
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
