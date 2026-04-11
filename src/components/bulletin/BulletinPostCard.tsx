'use client';

import Link from 'next/link';
import { Calendar, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { BulletinPost } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { resolveMediaUrl } from '@/lib/upload-utils';
import { AuthorDisplay } from '@/components/admin/AuthorDisplay';

/**
 * Extracts the first media source from HTML content.
 */
function extractFirstMedia(html: string): { type: 'image' | 'video' | 'audio', src: string } | null {
  if (!html) return null;
  
  const imgMatch = html.match(/<img[^>]+src="([^">]+)"/i);
  if (imgMatch) return { type: 'image', src: imgMatch[1] };
  
  const videoMatch = html.match(/<video[^>]+src="([^">]+)"/i);
  if (videoMatch) return { type: 'video', src: videoMatch[1] };
  
  const audioMatch = html.match(/<audio[^>]+src="([^">]+)"/i);
  if (audioMatch) return { type: 'audio', src: audioMatch[1] };
  
  return null;
}

/**
 * Modernized Bulletin Card: Vertical layout consistent with EventCard.
 * Uses unified AuthorDisplay to handle role-based identity and "S" initial avatars.
 */
export function BulletinPostCard({ post }: { post: BulletinPost }) {
  const contentSnippet = post.content.replace(/<[^>]+>/g, '').substring(0, 120) + '...';

  const formattedDate = post.createdAt 
    ? format(post.createdAt.toDate(), 'MMM d, yyyy')
    : '';

  return (
    <Link href={`/bulletin/${post.id}`} className="block h-full group">
      <Card className="flex flex-col w-full h-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white border-none rounded-xl relative">
        
        {/* Media Slot: Priority 1: First Gallery Image | Priority 2: Extracted from Content */}
        {(() => {
          let mediaUrl = '';
          let mediaType: 'image' | 'video' | 'audio' = 'image';

          if (post.galleryImages && post.galleryImages.length > 0) {
              const firstAsset = post.galleryImages[0];
              mediaUrl = resolveMediaUrl(firstAsset);
              mediaType = (typeof firstAsset !== 'string' && firstAsset.resource_type === 'video') ? 'video' : 'image';
          } else {
              const extracted = extractFirstMedia(post.content);
              if (extracted) {
                  mediaUrl = extracted.src;
                  mediaType = extracted.type;
              }
          }

          if (!mediaUrl) return null;
          
          if (mediaType === 'image') return (
            <img src={mediaUrl} alt="" className="w-full h-[200px] object-cover" />
          );
          
          if (mediaType === 'video') return (
            <video 
              src={mediaUrl} 
              autoPlay 
              muted 
              loop 
              playsInline 
              className="w-full h-[200px] object-cover bg-black" 
            />
          );
          
          if (mediaType === 'audio') return (
            <div className="px-4 pt-4 h-[200px] flex items-center bg-muted/10">
              <audio controls src={mediaUrl} className="w-full h-10" />
            </div>
          );
        })()}

        <Badge className="absolute top-3 right-3 bg-primary text-white uppercase font-black text-[9px] tracking-widest border-none shadow-md z-10">
          {post.category}
        </Badge>

        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-lg font-headline font-bold line-clamp-2 text-[#1e3a5f] leading-tight min-h-[3.5rem] group-hover:text-primary transition-colors">
            {post.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5 pt-0 flex-grow space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-medium">
            {contentSnippet}
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-dashed">
            {/* Role-based Avatar ("S") and Name handled by AuthorDisplay */}
            <AuthorDisplay 
                authorId={post.authorId} 
                fallbackName={post.authorName}
                showAvatar={true}
                className="text-[10px] font-bold text-primary tracking-tight truncate max-w-[120px]"
            />
            
            <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              <Calendar className="h-3 w-3 text-primary" />
              {formattedDate}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-5 pt-0 mt-auto">
          <Button variant="link" className="p-0 h-auto font-black text-[10px] uppercase tracking-widest text-primary flex items-center gap-1.5">
            Read Full Update
            <MessageCircle className="h-3 w-3" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
