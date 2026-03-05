'use client';

import { useState, useRef } from 'react';
import { Upload, ImageIcon, Loader2 } from 'lucide-react';
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
 * Multi-Image Upload Component with zero-ghost rendering.
 * Strictly uses conditional blocks to prevent broken image icons.
 */
export function MultiImageUpload({ images, onChange, folder }: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [localPreviews, setLocalPreviews] = useState<{ id: string; url: string }[]>([]);
  const cancelledUploads = useRef<Set<string>>(new Set());
  const storage = useStorage();
  const { toast } = useToast();

  // STRICT FILTER: Prevents broken image icons from rendering if URLs are invalid
  const validImages = (images || []).filter(img => 
    typeof img === 'string' && 
    img.trim() !== '' && 
    img !== 'undefined' && 
    img !== 'null'
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !storage) return;

    setIsUploading(true);
    
    const newPreviews: { id: string; url: string }[] = [];
    const pendingUploads: { id: string; file: File }[] = [];

    for (let i = 0; i < files.length; i++) {
        const id = Math.random().toString(36).substring(7);
        const url = URL.createObjectURL(files[i]);
        newPreviews.push({ id, url });
        pendingUploads.push({ id, file: files[i] });
    }

    setLocalPreviews(prev => [...prev, ...newPreviews]);

    try {
      const successfullyUploadedUrls: string[] = [];

      for (const upload of pendingUploads) {
        if (cancelledUploads.current.has(upload.id)) continue;

        const storageRef = ref(storage, `${folder}/${Date.now()}_${upload.file.name}`);
        const snapshot = await uploadBytes(storageRef, upload.file);
        const url = await getDownloadURL(snapshot.ref);
        
        if (!cancelledUploads.current.has(upload.id)) {
            successfullyUploadedUrls.push(url);
        }
      }

      if (successfullyUploadedUrls.length > 0) {
          onChange([...validImages, ...successfullyUploadedUrls]);
      }
      
      setLocalPreviews(prev => prev.filter(p => !pendingUploads.find(up => up.id === p.id)));
      
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast({ variant: 'destructive', title: 'Upload Error', description: error.message });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...validImages];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const cancelLocalPreview = (id: string, url: string) => {
    cancelledUploads.current.add(id);
    setLocalPreviews(prev => prev.filter(p => p.id !== id));
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">
          Attached Media ({validImages.length + localPreviews.length})
        </Label>
        <div className="flex items-center gap-2">
          {isUploading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-full text-xs font-black hover:bg-[#1e3a5f]/90 transition-all shadow-lg uppercase tracking-widest">
              <Upload className="h-3.5 w-3.5" />
              Upload Files
            </div>
            <input 
              type="file" 
              multiple 
              className="hidden" 
              accept="image/*,video/*,audio/*" 
              onChange={handleFileChange} 
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {/* Render Permanent Images - 100% conditional */}
        {validImages.length > 0 && validImages.map((url, index) => (
          <MediaItem 
            key={`saved-${index}`} 
            url={url} 
            onRemove={() => removeImage(index)} 
          />
        ))}

        {/* Render Temporary Previews - 100% conditional */}
        {localPreviews.length > 0 && localPreviews.map((preview) => (
          <MediaItem 
            key={preview.id} 
            url={preview.url} 
            isLoading={true}
            onRemove={() => cancelLocalPreview(preview.id, preview.url)} 
          />
        ))}

        {validImages.length === 0 && localPreviews.length === 0 && !isUploading && (
          <div className="col-span-full border-2 border-dashed rounded-3xl py-16 flex flex-col items-center justify-center text-muted-foreground bg-muted/5 border-muted-foreground/20">
            <ImageIcon className="h-12 w-12 mb-4 opacity-10" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">No media selected</p>
          </div>
        )}
      </div>
    </div>
  );
}