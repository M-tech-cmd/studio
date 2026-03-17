
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
 * Robust Multi-Image Upload Component.
 * Features per-ID tracking and a 30-second sync timeout to prevent infinite loading.
 */
export function MultiImageUpload({ images, onChange, folder }: MultiImageUploadProps) {
  // Track specific IDs being uploaded to avoid global freezing
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const [localPreviews, setLocalPreviews] = useState<{ id: string; url: string }[]>([]);
  const storage = useStorage();
  const { toast } = useToast();

  const validImages = (images || []).filter(img => 
    typeof img === 'string' && img.trim() !== '' && img !== 'undefined' && img !== 'null'
  );

  const uploadWithTimeout = async (storageRef: any, file: File, timeoutMs: number = 30000) => {
    const uploadPromise = uploadBytes(storageRef, file);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Sync Timeout: Upload exceeded 30 seconds')), timeoutMs)
    );
    return Promise.race([uploadPromise, timeoutPromise]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !storage) return;

    const newEntries: { id: string; url: string; file: File }[] = [];
    for (let i = 0; i < files.length; i++) {
      const id = Math.random().toString(36).substring(7);
      const url = URL.createObjectURL(files[i]);
      newEntries.push({ id, url, file: files[i] });
    }

    // Show previews and mark as uploading immediately
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
        
        // Remove from temporary state on success
        setLocalPreviews(prev => prev.filter(p => p.id !== entry.id));
        setUploadingIds(prev => {
          const next = new Set(prev);
          next.delete(entry.id);
          return next;
        });
      } catch (error: any) {
        console.error(`Media Sync Blocked for ${entry.id}:`, error);
        toast({ 
          variant: 'destructive', 
          title: 'Sync Failed', 
          description: error.message || 'Check your connection or storage permissions.' 
        });
        
        // Clear failed item
        setLocalPreviews(prev => prev.filter(p => p.id !== entry.id));
        setUploadingIds(prev => {
          const next = new Set(prev);
          next.delete(entry.id);
          return next;
        });
      }
    }

    if (newUrls.length > 0) {
      onChange([...validImages, ...newUrls]);
    }
    
    if (e.target) e.target.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = [...validImages];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">
          Attached Media ({validImages.length + localPreviews.length})
        </Label>
        <div className="flex items-center gap-2">
          {uploadingIds.size > 0 && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-full text-xs font-black hover:bg-[#1e3a5f]/90 transition-all shadow-lg uppercase tracking-widest">
              <Upload className="h-3.5 w-3.5" />
              Upload Files
            </div>
            <input type="file" multiple className="hidden" accept="image/*,video/*,audio/*" onChange={handleFileChange} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {validImages.map((url, index) => (
          <MediaItem key={`saved-${index}`} url={url} onRemove={() => removeImage(index)} />
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
          <div className="col-span-full border-2 border-dashed rounded-3xl py-16 flex flex-col items-center justify-center text-muted-foreground bg-muted/5 border-muted-foreground/20">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">No media selected</p>
          </div>
        )}
      </div>
    </div>
  );
}
