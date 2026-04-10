'use client';

import Image from 'next/image';
import { X, Play, Video, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/upload-utils';
import type { CloudinaryAsset } from '@/lib/types';

interface MediaItemProps {
  url: string | CloudinaryAsset;
  onRemove?: () => void;
  className?: string;
  showIconOverlay?: boolean;
}

/**
 * Universal Media Item (Cloudinary Optimized).
 * Renders Image, Video, or Audio based on URL detection.
 * Optimized for compact display in grids and lists.
 */
export function MediaItem({ 
  url: asset, 
  onRemove, 
  className,
  showIconOverlay = true
}: MediaItemProps) {

  const url = resolveMediaUrl(asset);
  if (!url || url === 'undefined' || url === 'null') return null;

  const isVideo = (typeof asset !== 'string' && asset.resource_type === 'video') || 
                  (typeof asset === 'string' && url.toLowerCase().match(/\.(mp4|webm|mov|video)/)) || 
                  (typeof asset === 'string' && url.startsWith('data:video'));

  const isAudio = (typeof asset === 'string' && (url.toLowerCase().match(/\.(mp3|wav|ogg|audio)/) || url.startsWith('data:audio')));

  return (
    <div className={cn(
      "group relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-md isolate border-2 border-border/50 transition-all hover:ring-4 hover:ring-primary/20",
      className
    )}>
      
      {isAudio ? (
        <div className="h-full w-full flex flex-col items-center justify-center bg-slate-100 gap-2">
          <Mic className="h-8 w-8 text-primary/40" />
          <span className="text-[8px] font-black uppercase tracking-widest text-primary/60">Voice/Audio</span>
          {showIconOverlay && (
              <audio src={url} controls className="absolute bottom-2 scale-[0.65] w-full opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      ) : isVideo ? (
        <div className="h-full w-full bg-slate-900 flex items-center justify-center">
          <Video className="h-10 w-10 text-white/20" />
          {showIconOverlay && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg scale-90 group-hover:scale-100 transition-transform">
                <Play className="h-5 w-5 fill-current ml-1" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <Image
          src={url}
          alt="Media item"
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          unoptimized
        />
      )}

      {onRemove && (
        <button
          type="button"
          className="absolute top-2 left-2 h-7 w-7 rounded-full shadow-2xl z-[70] bg-black/60 backdrop-blur-md text-white hover:bg-black/80 hover:scale-110 active:scale-95 transition-all border border-white/20 flex items-center justify-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-4 w-4 stroke-[3px]" />
        </button>
      )}
    </div>
  );
}
