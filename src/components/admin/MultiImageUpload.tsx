'use client';

import { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useStorage } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { MediaItem } from '../shared/MediaItem';

interface MultiImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  folder: string;
}

/**
 * Enhanced Multi-Image Upload Component.
 * Features per-ID state tracking and a 30-second safety timeout.
 */
export function MultiImageUpload({ images, onChange, folder }: MultiImageUploadProps) {
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const [localPreviews, setLocalPreviews] = useState<{ id: string; url: string }[]>([]);
  const storage = useStorage();
  const { toast } = useToast();

  const validImages = (images || []).filter(img => 
    typeof img === 'string' && img.trim() !== '' && img !== 'undefined'
  );

  const uploadWithTimeout = async (storageRef: any, file: File) => {
    const uploadPromise = uploadBytes(storageRef, file);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Sync Timeout: Connection unstable')), 30000)
    );
    return Promise.race([uploadPromise, timeoutPromise]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !storage) return;

    const newEntries = Array.from(files).map(file => ({
      id: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file),
      file
    }));

    setLocalPreviews(prev => [...prev, ...newEntries.map(e => ({ id: e.id, url: e.url }))]);
    setUploadingIds(prev => {
      const next = new Set(prev);
      newEntries.forEach(e => next.add(e.id));
      return next;
    });

    const newUrls: string[] = [];

    for (const entry of newEntries) {
      try {
        const storageRef = ref(storage, `${folder}/${Date.now()}_${entry.file.name}`);
        const snapshot: any = await uploadWithTimeout(storageRef, entry.file);
        const url = await getDownloadURL(snapshot.ref);
        newUrls.push(url);
      } catch (error: any) {
        console.error(`Media Deadlock for ${entry.id}:`, error);
        toast({ 
          variant: 'destructive', 
          title: 'Sync Interrupted', 
          description: error.message || 'Check connection and try again.' 
        });
      } finally {
        setLocalPreviews(prev => prev.filter(p => p.id !== entry.id));
        setUploadingIds(prev => {
          const next = new Set(prev);
          next.delete(entry.id);
          return next;
        });
        URL.revokeObjectURL(entry.url);
      }
    }

    if (newUrls.length > 0) {
      onChange([...validImages, ...newUrls]);
    }
    
    if (e.target) e.target.value = '';
  };

  const removeImage = (index: number) => {
    const next = [...validImages];
    next.splice(index, 1);
    onChange(next);
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl border border-dashed">
        <div className="space-y-1">
          <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Gallery Media</Label>
          <p className="text-[9px] text-muted-foreground italic">Max 30s upload window per item.</p>
        </div>
        <div className="flex items-center gap-3">
          {uploadingIds.size > 0 && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
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
        {validImages.map((url, index) => (
          <MediaItem key={url + index} url={url} onRemove={() => removeImage(index)} />
        ))}

        {localPreviews.map((preview) => (
          <MediaItem 
            key={preview.id} 
            url={preview.url} 
            isLoading={uploadingIds.has(preview.id)} 
            onRemove={() => {
                setLocalPreviews(prev => prev.filter(p => p.id !== preview.id));
                setUploadingIds(prev => {
                    const next = new Set(prev);
                    next.delete(preview.id);
                    return next;
                });
            }} 
          />
        ))}

        {validImages.length === 0 && localPreviews.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground/40 bg-muted/5 border-2 border-dashed rounded-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Empty Gallery</p>
          </div>
        )}
      </div>
    </div>
  );
}
