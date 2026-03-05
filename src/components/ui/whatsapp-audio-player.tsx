'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, Mic, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WhatsAppAudioPlayerProps {
  src: string;
  className?: string;
  onRemove?: () => void;
}

/**
 * High-Fidelity WhatsApp-Style Audio Player Component.
 * Features a light-gray chat bubble design, blue play controls, and dual timers.
 */
export function WhatsAppAudioPlayer({ src, className, onRemove }: WhatsAppAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  return (
    <div className={cn(
      "relative flex items-center gap-4 p-4 bg-[#f0f2f5] dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-sm border border-slate-200/50 hover:border-primary/30 transition-all isolate",
      className
    )}>
      {onRemove && (
          <button 
            onClick={onRemove}
            className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-20"
          >
              <X className="h-3 w-3" />
          </button>
      )}

      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
      
      <div className="relative shrink-0">
        <button
          onClick={togglePlay}
          className="h-12 w-12 rounded-full bg-[#005c96] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
        >
          {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current ml-1" />}
        </button>
        <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center border border-border shadow-sm">
            <Mic className="h-3 w-3 text-[#005c96]" />
        </div>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 bg-slate-300 dark:bg-slate-600 rounded-full relative">
                <div 
                    className="absolute inset-y-0 left-0 bg-[#005c96] rounded-full" 
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                />
                <input 
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSliderChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                />
                <div 
                    className="absolute h-3 w-3 bg-[#005c96] rounded-full top-1/2 -translate-y-1/2 shadow-sm pointer-events-none"
                    style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 6px)` }}
                />
            </div>
            <Volume2 className="h-4 w-4 text-slate-500" />
        </div>
        
        <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black text-[#005c96] tracking-widest uppercase">
                {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <div className="flex gap-0.5 opacity-20">
                {[1,2,3,4,5,6,7].map(i => (
                    <div key={i} className="w-0.5 h-2 bg-[#005c96] rounded-full" />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
