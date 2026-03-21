'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Upload, Link as LinkIcon, X, Film, Music } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value: string; // Current URL
  file: File | null; // Current pending file
  onChange: (url: string, file: File | null) => void;
  label?: string;
  className?: string;
  folder?: string;
}

/**
 * Individual Media Selection Component (Cloudinary Ready).
 * Supports URL entry or File selection (Image, Video, Audio) with instant local preview.
 */
export function ImageUpload({ value, file, onChange, label, className }: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(value || '');
  const [fileType, setFileType] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setFileType(file.type);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(value);
      setFileType('');
    }
  }, [value, file]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    onChange('', selectedFile);
  };

  const handleUrlChange = (url: string) => {
    onChange(url, null);
  };

  const clearImage = () => {
    onChange('', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isVideo = fileType.startsWith('video/') || preview.toLowerCase().match(/\.(mp4|mov|webm)/);
  const isAudio = fileType.startsWith('audio/') || preview.toLowerCase().match(/\.(mp3|wav|ogg)/);

  return (
    <div className={cn("space-y-4", className)}>
      {label && <Label className="font-bold">{label}</Label>}
      
      <Tabs defaultValue={file ? "upload" : (value ? "url" : "upload")} className="w-full">
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
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Select Media File</span>
            <span className="text-[9px] text-muted-foreground opacity-60">Photos, Videos, Audio</span>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,video/*,audio/*" 
              onChange={handleFileSelect} 
            />
          </div>
        </TabsContent>

        <TabsContent value="url" className="mt-2">
          <Input 
            placeholder="Paste media link here..." 
            value={value}
            autoComplete="off"
            onChange={(e) => handleUrlChange(e.target.value)}
            className="h-12"
          />
        </TabsContent>
      </Tabs>

      {preview && (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-primary/10 shadow-lg bg-muted/5 group animate-in fade-in zoom-in-95 isolate">
          {isVideo ? (
            <video src={preview} className="w-full h-full object-contain" controls />
          ) : isAudio ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <Music className="h-12 w-12 text-primary opacity-40" />
                <audio src={preview} controls className="w-[80%]" />
            </div>
          ) : (
            <Image 
              src={preview} 
              alt="Upload Preview" 
              fill 
              className="object-contain" 
              unoptimized 
            />
          )}
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 left-2 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center shadow-xl hover:bg-black transition-all z-50 border border-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {file && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-primary text-white text-[10px] font-bold rounded uppercase shadow-lg">
              Pending Sync
            </div>
          )}
        </div>
      )}
    </div>
  );
}
