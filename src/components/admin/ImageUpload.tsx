'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Upload, Link as LinkIcon, X } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useStorage } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  label?: string;
  className?: string;
}

/**
 * Universal Dual-Mode Image Upload Component.
 * Features instant previews via blob URLs and silent atomic cloud sync.
 * Absolute-positioned top-left 'X' button for instant removal.
 */
export function ImageUpload({ value, onChange, folder, label, className }: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(value || '');
  const storage = useStorage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(value);
  }, [value]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    // 1. Instant Local Preview
    const blobUrl = URL.createObjectURL(file);
    setPreview(blobUrl);

    // 2. Silent Atomic Upload
    try {
      const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      // 3. Update Parent State
      onChange(downloadUrl);
      URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Upload Failed', 
        description: error.message || 'Check your internet connection.' 
      });
      setPreview(value); // Revert to original if failed
    }
  };

  const handleUrlChange = (url: string) => {
    setPreview(url);
    onChange(url);
  };

  const clearImage = () => {
    if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
    }
    setPreview('');
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={cn("space-y-4", className)}>
      {label && <Label className="font-bold">{label}</Label>}
      
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" /> Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="gap-2">
            <LinkIcon className="h-4 w-4" /> URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-2">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors bg-muted/10 group"
          >
            <Upload className="h-8 w-8 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Select Image File</span>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileSelect} 
            />
          </div>
        </TabsContent>

        <TabsContent value="url" className="mt-2">
          <Input 
            placeholder="Paste image link here..." 
            value={preview.startsWith('blob:') ? '' : preview}
            autoComplete="off"
            onChange={(e) => handleUrlChange(e.target.value)}
            className="h-12"
          />
        </TabsContent>
      </Tabs>

      {preview && (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-primary/10 shadow-lg bg-muted/5 group animate-in fade-in zoom-in-95 isolate">
          <Image 
            src={preview} 
            alt="Upload Preview" 
            fill 
            className="object-contain" 
            unoptimized 
          />
          {/* Top-Left X Button */}
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 left-2 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center shadow-xl hover:bg-black transition-all z-50 border border-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
