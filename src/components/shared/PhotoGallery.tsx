'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Maximize2, Film } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CustomVideoPlayer } from '@/components/ui/custom-video-player';
import { MediaItem } from './MediaItem';

interface PhotoGalleryProps {
  photos?: string[];
  title?: string;
}

export function PhotoGallery({ photos, title = "Photo Gallery" }: PhotoGalleryProps) {
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);

  if (!photos || photos.length === 0) return null;

  const isVideo = (url: string) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('.mp4') || 
           lowerUrl.includes('.mov') || 
           lowerUrl.includes('.webm') ||
           lowerUrl.includes('video') ||
           url.startsWith('data:video');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4 border-dashed">
        <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
            <Film className="h-6 w-6 text-primary" />
            Moments & Archives
        </h3>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Interactive Gallery</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((url, index) => {
          const video = isVideo(url);
          return (
            <Dialog key={index}>
              <DialogTrigger asChild>
                <div className="cursor-pointer" onClick={() => setSelectedMedia(url)}>
                    <MediaItem url={url} showIconOverlay={true} />
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 overflow-hidden bg-black/95 border-none rounded-3xl">
                <DialogHeader className="sr-only">
                  <DialogTitle>View Media</DialogTitle>
                </DialogHeader>
                <div className="relative w-full h-full flex items-center justify-center p-4">
                  {video ? (
                    <CustomVideoPlayer src={url} className="w-full h-full max-h-[75vh]" />
                  ) : (
                    <div className="relative w-full h-full">
                      <Image
                        src={url}
                        alt="Full screen view"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>
    </div>
  );
}
