'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, Info } from 'lucide-react';
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

interface LocalPreview {
  id: string;
  url: string;
  file: File;
}

/**
 * IMPLEMENT INSTANT UI PREVIEWS (GEMINI METHOD)
 * Features parallel background workers, instant previews, and granular error states.
 */
export function MultiImageUpload({ images, onChange, folder }: MultiImageUploadProps) {
  const [localPreviews, setLocalPreviews] = useState<LocalPreview[]>([]);
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const storage = useStorage();
  const { toast } = useToast();

  // Use a ref to track current valid images to avoid closure race conditions during parallel updates
  const committedUrlsRef = useRef<string[]>(images || []);
  useEffect(() => {
    committedUrlsRef.current = images || [];
  }, [images]);

  const validImages = (images || []).filter(img => 
    typeof img === 'string' && img.trim() !== '' && img !== 'undefined'
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !storage) return;

    // BATCH LIMIT: Hard-cap at 10 images for stability
    const selectedFiles = Array.from(files).slice(0, 10);
    if (files.length > 10) {
        toast({ 
            variant: 'destructive', 
            title: 'Limit Exceeded', 
            description: 'Please select a maximum of 10 images per batch.' 
        });
    }

    // 1. INSTANT UI PREVIEWS: Create local URLs immediately
    const newPreviews: LocalPreview[] = selectedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file),
      file
    }));

    setLocalPreviews(prev => [...prev, ...newPreviews]);
    setUploadingIds(prev => {
      const next = new Set(prev);
      newPreviews.forEach(p => next.add(p.id));
      return next;
    });

    // 2. PARALLEL BACKGROUND WORKERS: Start uploads without awaiting inside the loop
    newPreviews.forEach(preview => {
      uploadWorker(preview);
    });

    // Clear input so same files can be re-selected if needed
    if (e.target) e.target.value = '';
  };

  /**
   * Independent upload worker for a single file.
   * Manages its own sync state and handles errors gracefully.
   */
  const uploadWorker = async (preview: LocalPreview) => {
    const storageRef = ref(storage, `${folder}/${Date.now()}_${preview.id}_${preview.file.name}`);
    
    try {
      // Safety Timeout: 60 seconds
      const uploadPromise = uploadBytes(storageRef, preview.file);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sync Timeout')), 60000)
      );

      await Promise.race([uploadPromise, timeoutPromise]);
      const downloadURL = await getDownloadURL(storageRef);

      // Successfully synced: Update parent and local state
      const nextUrls = [...committedUrlsRef.current, downloadURL];
      committedUrlsRef.current = nextUrls;
      onChange(nextUrls);

      // Cleanup preview
      setLocalPreviews(prev => prev.filter(p => p.id !== preview.id));
      setUploadingIds(prev => {
        const next = new Set(prev);
        next.delete(preview.id);
        return next;
      });
      URL.revokeObjectURL(preview.url);

    } catch (error: any) {
      console.error(`Upload worker ${preview.id} failed:`, error);
      
      // Mark as failed instead of timing out the whole set
      setFailedIds(prev => new Set([...prev, preview.id]));
      setUploadingIds(prev => {
        const next = new Set(prev);
        next.delete(preview.id);
        return next;
      });
      
      toast({ 
        variant: 'destructive', 
        title: 'Sync Failed', 
        description: `Could not upload ${preview.file.name}.` 
      });
    }
  };

  const removeImage = (index: number) => {
    const next = [...validImages];
    next.splice(index, 1);
    onChange(next);
  };

  const removeLocalPreview = (id: string, url: string) => {
    setLocalPreviews(prev => prev.filter(p => p.id !== id));
    setUploadingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setFailedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl border border-dashed border-primary/20">
        <div className="space-y-1">
          <Label className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Gallery Media</Label>
          <p className="text-[9px] text-muted-foreground italic">Parallel sync • Max 10 items per batch.</p>
        </div>
        <div className="flex items-center gap-3">
          {uploadingIds.size > 0 && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] text-white rounded-full text-[10px] font-black hover:bg-[#1e3a5f]/90 transition-all shadow-lg uppercase tracking-widest active:scale-95">
              <Upload className="h-3.5 w-3.5" />
              Instant Upload
            </div>
            <input type="file" multiple className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {/* Confirmed Cloud Images */}
        {validImages.map((url, index) => (
          <MediaItem key={`cloud-${url}-${index}`} url={url} onRemove={() => removeImage(index)} />
        ))}

        {/* Local Previews with Status Overlays */}
        {localPreviews.map((preview) => (
          <MediaItem 
            key={`preview-${preview.id}`} 
            url={preview.url} 
            isLoading={uploadingIds.has(preview.id)} 
            isError={failedIds.has(preview.id)}
            onRemove={() => removeLocalPreview(preview.id, preview.url)} 
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
