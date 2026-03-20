'use client';

import { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { MediaItem } from '../shared/MediaItem';

interface MultiImageUploadProps {
  existingImages: string[];
  newFiles: File[];
  onChange: (existing: string[], newFiles: File[]) => void;
  label?: string;
}

/**
 * Multi-Image Selection Component.
 * Manages local state for new files and existing cloud URLs.
 * Does not upload to storage directly; returns state to parent for transactional save.
 */
export function MultiImageUpload({ existingImages, newFiles, onChange, label }: MultiImageUploadProps) {
  const [previews, setPreviews] = useState<{ id: string; url: string }[]>([]);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      previews.forEach(p => URL.revokeObjectURL(p.url));
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
        <Label className="font-bold">{label || 'Gallery Media'} ({existingImages.length + newFiles.length})</Label>
        <label className="cursor-pointer">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-xs font-bold hover:opacity-90 transition-all shadow-md">
            <Upload className="h-4 w-4" />
            Select Files
          </div>
          <input type="file" multiple className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {/* Existing Images (from Cloud) */}
        {existingImages.map((url, index) => (
          <MediaItem 
            key={`existing-${index}`} 
            url={url} 
            onRemove={() => removeExisting(index)} 
          />
        ))}

        {/* New Files (Local Previews) */}
        {previews.map((preview, index) => (
          <div key={preview.id} className="relative group">
            <MediaItem 
              url={preview.url} 
              onRemove={() => removeNew(preview.id, index)} 
            />
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 text-[8px] text-white font-bold rounded uppercase">
              Pending
            </div>
          </div>
        ))}

        {existingImages.length === 0 && newFiles.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground/40 bg-muted/5 border-2 border-dashed rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Media Selected</p>
          </div>
        )}
      </div>
    </div>
  );
}
