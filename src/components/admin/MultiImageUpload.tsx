'use client';

import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { MediaItem } from '../shared/MediaItem';

interface MultiImageUploadProps {
  existingImages: string[];
  newFiles: File[];
  onChange: (existing: string[], newFiles: File[]) => void;
  label?: string;
}

/**
 * Multi-Media Selection Component (Cloudinary Engine).
 * Supports Images, Video, and Audio concurrently.
 */
export function MultiImageUpload({ existingImages, newFiles, onChange, label }: MultiImageUploadProps) {
  const [previews, setPreviews] = useState<{ id: string; url: string }[]>([]);

  useEffect(() => {
    return () => {
      previews.forEach(p => {
        if (p.url.startsWith('blob:')) {
          URL.revokeObjectURL(p.url);
        }
      });
    };
  }, [previews]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);
    
    const newPreviews = selectedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file)
    }));

    setPreviews(prev => [...prev, ...newPreviews]);
    onChange(existingImages, [...newFiles, ...selectedFiles]);

    if (e.target) e.target.value = '';
  };

  const removeExisting = (index: number) => {
    const next = [...existingImages];
    next.splice(index, 1);
    onChange(next, newFiles);
  };

  const removeNew = (id: string, fileIndex: number) => {
    const previewToRemove = previews.find(p => p.id === id);
    if (previewToRemove) {
      URL.revokeObjectURL(previewToRemove.url);
      setPreviews(prev => prev.filter(p => p.id !== id));
    }
    
    const nextFiles = [...newFiles];
    nextFiles.splice(fileIndex, 1);
    onChange(existingImages, nextFiles);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="font-bold text-sm uppercase tracking-tight">
          {label || 'Gallery Media'} ({existingImages.length + newFiles.length})
        </Label>
        <label className="cursor-pointer">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg active:scale-95">
            <Upload className="h-4 w-4" />
            Add Media
          </div>
          <input type="file" multiple className="hidden" accept="image/*,video/*,audio/*" onChange={handleFileChange} />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {existingImages.map((url, index) => (
          <MediaItem 
            key={`existing-${index}`} 
            url={url} 
            onRemove={() => removeExisting(index)} 
          />
        ))}

        {previews.map((preview, index) => (
          <div key={preview.id} className="relative group animate-in fade-in zoom-in-95 duration-300">
            <MediaItem 
              url={preview.url} 
              onRemove={() => removeNew(preview.id, index)} 
            />
          </div>
        ))}

        {existingImages.length === 0 && newFiles.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-muted-foreground/30 bg-muted/5 border-4 border-dashed rounded-[2rem] transition-colors hover:bg-muted/10">
            <Upload className="h-10 w-10 mb-4 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Archive is Empty</p>
          </div>
        )}
      </div>
    </div>
  );
}
