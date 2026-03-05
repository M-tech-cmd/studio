'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { SiteSettings } from '@/lib/types';

interface SectionHeaderProps {
  title?: string;
  description?: string;
  titleColor?: string;
  descColor?: string;
  boxColor?: string;
  imageUrl?: string;
  isLoading: boolean;
  settings?: SiteSettings;
}

/**
 * Enhanced Section Header with Fixed 450px Banner Image.
 * Eliminates bottom gaps and ensures perfect contact with the text box below.
 */
export function SectionHeader({ 
  title, 
  description, 
  titleColor, 
  descColor, 
  boxColor,
  imageUrl,
  isLoading,
  settings
}: SectionHeaderProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Fallback Logic: Local Overide -> Global Text Color -> Default Navy
  const finalTitleColor = (titleColor && titleColor.trim() !== '') 
    ? titleColor 
    : (settings?.globalTextColor && settings.globalTextColor.trim() !== '')
        ? settings.globalTextColor
        : '#1e3a5f';

  // Fallback Logic: Local Override -> Global Text Color -> Default Slate
  const finalDescColor = (descColor && descColor.trim() !== '') 
    ? descColor 
    : (settings?.globalTextColor && settings.globalTextColor.trim() !== '')
        ? settings.globalTextColor
        : '#4b5563';

  const finalBoxColor = (boxColor && boxColor.trim() !== '') 
    ? boxColor 
    : 'transparent';

  useEffect(() => {
    // Injecting with !important to ensure dashboard choices take absolute precedence
    if (titleRef.current) {
      titleRef.current.style.setProperty('color', finalTitleColor, 'important');
    }
    if (descRef.current && finalDescColor) {
      descRef.current.style.setProperty('color', finalDescColor, 'important');
    }
    if (boxRef.current) {
        boxRef.current.style.setProperty('background-color', finalBoxColor, 'important');
    }
  }, [finalTitleColor, finalDescColor, finalBoxColor]);

  if (isLoading) {
    return (
      <div className="text-center mb-10 space-y-2">
        <Skeleton className="h-10 w-64 mx-auto" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mb-12 animate-fade-in isolate w-full">
      <div 
        ref={boxRef}
        className={cn(
            "max-w-4xl w-full rounded-2xl shadow-sm border border-border/50 text-center transition-all duration-300 overflow-hidden",
            finalBoxColor === 'transparent' ? "bg-transparent border-none shadow-none" : "shadow-md"
        )}
      >
        {imageUrl && (
            <div className="relative w-full h-[450px] block m-0 p-0 overflow-hidden bg-muted/10">
                <Image 
                    src={imageUrl} 
                    alt={title || 'Section banner'} 
                    fill 
                    style={{ objectFit: 'cover', display: 'block' }}
                    className="w-full m-0 p-0"
                    unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
        )}
        
        <div className={cn("px-6 md:px-14 flex flex-col items-center", imageUrl ? "pt-8 pb-10 md:pb-14" : "pt-10 md:pt-14 pb-10 md:pb-14")}>
            <h2 
              ref={titleRef}
              className="text-3xl md:text-5xl font-headline font-bold tracking-tight text-center"
            >
              {title}
            </h2>
            {description && (
                <p 
                    ref={descRef}
                    className="mt-6 max-w-2xl mx-auto text-base md:text-xl font-medium leading-relaxed opacity-90 text-center"
                >
                    {description}
                </p>
            )}
        </div>
      </div>
    </div>
  );
}
