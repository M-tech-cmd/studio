import { Church } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '../ui/skeleton';

interface LogoProps {
  url?: string;
  className?: string;
}

/**
 * Dynamic Parish Logo Component.
 * Prioritizes the official branding URL from Site Settings.
 */
export function Logo({ url, className }: LogoProps) {
  if (url === undefined) {
    return <Skeleton className={`h-10 w-10 rounded-full ${className}`} />;
  }

  // Use the dynamic URL if available, otherwise fallback to the themed Church icon
  if (url && url.trim() !== '' && !url.includes('placeholder')) {
    return (
      <div className={`relative h-10 w-10 overflow-hidden rounded-full border border-border bg-background flex-shrink-0 p-0.5 ${className}`}>
        <div className="relative h-full w-full rounded-full overflow-hidden">
          <Image 
            src={url} 
            alt="Parish Logo" 
            fill 
            className="object-cover" 
            unoptimized 
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center justify-center bg-primary text-primary-foreground h-10 w-10 rounded-full flex-shrink-0 shadow-sm border-2 border-white/50 ${className}`}>
      <Church className="h-6 w-6" />
    </div>
  );
}
