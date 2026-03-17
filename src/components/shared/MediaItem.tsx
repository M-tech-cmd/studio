'use client';

import Image from 'next/image';
import { X, Play, Video, Music, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface MediaItemProps {
  url: string;
  onRemove?: () => void;
  isLoading?: boolean;
  isError?: boolean;
  progress?: number;
  className?: string;
  showIconOverlay?: boolean;
}

/**
 * Enhanced Media Item with strictly conditional rendering.
 * Features a unique "Syncing" overlay for local previews and an error state.
 */
export function MediaItem({ 
  url, 
  onRemove, 
  isLoading, 
  isError,
  progress, 
  className,
  showIconOverlay = true
}: MediaItemProps) {
  // STRICT GUARD: Prevent broken image ghosts
  if (!url || typeof url !== 'string' || url.trim() === '' || url === 'undefined' || url === 'null') {
    return null;
  }

  const isVideo = url.toLowerCase().match(/\.(mp4|webm|mov|video)/) || url.startsWith('data:video');
  const isAudio = url.toLowerCase().match(/\.(mp3|wav|ogg|audio)/) || url.startsWith('data:audio');

  return (
    <div className={cn(
      "group relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-md isolate border-2 border-border/50 transition-all",
      !isLoading && !isError && "hover:ring-4 hover:ring-primary/20",
      isError && "border-destructive/50 ring-2 ring-destructive/20",
      className
    )}>
      {isAudio ? (
        <div className="h-full w-full flex items-center justify-center bg-slate-100">
          <Music className="h-10 w-10 text-primary/40" />
        </div>
      ) : isVideo ? (
        <div className="h-full w-full bg-slate-900 flex items-center justify-center">
          <Video className="h-10 w-10 text-white/20" />
          {showIconOverlay && !isLoading && !isError && (
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg scale-90 group-hover:scale-100 transition-transform">
                    <Play className="h-6 w-6 fill-current ml-1" />
                </div>
            </div>
          )}
        </div>
      ) : (
        <Image
          src={url}
          alt="Media item"
          fill
          className={cn(
            "object-cover transition-transform duration-700",
            !isLoading && !isError && "group-hover:scale-110",
            (isLoading || isError) && "opacity-40 grayscale"
          )}
          unoptimized
        />
      )}

      {/* Individual Sync Progress Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/40 backdrop-blur-[2px]">
          <Loader2 className="h-8 w-8 animate-spin text-white mb-3" />
          <div className="w-full px-6 text-center">
              <p className="text-[9px] font-black text-white uppercase tracking-widest mb-1.5 drop-shadow-md">
                Syncing Media...
              </p>
              <Progress value={progress ?? 45} className="h-1 bg-white/20" />
          </div>
        </div>
      )}

      {/* Error State Overlay */}
      {isError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-destructive/40 backdrop-blur-[2px]">
          <AlertCircle className="h-8 w-8 text-white mb-2" />
          <p className="text-[9px] font-black text-white uppercase tracking-widest text-center px-4">
            Upload Failed
          </p>
        </div>
      )}

      {onRemove && (
        <button
          type="button"
          className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-2xl z-[60] bg-white text-destructive hover:bg-white/90 hover:scale-110 active:scale-95 transition-all border-2 border-black/10 flex items-center justify-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-5 w-5 stroke-[4px]" />
        </button>
      )}
    </div>
  );
}
