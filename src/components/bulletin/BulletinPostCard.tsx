'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MessageCircle, Play, Mic } from 'lucide-react';
import { format } from 'date-fns';
import type { BulletinPost, RegisteredUser } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Modernized Bulletin Card: Vertical layout consistent with EventCard.
 * Features a top media slot, dynamic author identity, and standardized metadata.
 */
export function BulletinPostCard({ post }: { post: BulletinPost }) {
  const firestore = useFirestore();
  
  // Dynamic fetch for Author profile photo
  const authorRef = useMemoFirebase(() => 
    post.authorId ? doc(firestore, 'users', post.authorId) : null, 
    [firestore, post.authorId]
  );
  const { data: author } = useDoc<RegisteredUser>(authorRef);

  const isVideo = (url: string) => /\.(mp4|webm|ogg|mov)/i.test(url);
  const isAudio = (url: string) => /\.(mp3|wav|flac)/i.test(url);

  // Extract first image from gallery as hero
  const mainImageUrl = post.galleryImages && post.galleryImages.length > 0 ? post.galleryImages[0] : null;
  const contentSnippet = post.content.replace(/<[^>]+>/g, '').substring(0, 120) + '...';

  const formattedDate = post.createdAt 
    ? format(post.createdAt.toDate(), 'MMMM d, yyyy').toUpperCase() 
    : '';

  return (
    <Link href={`/bulletin/${post.id}`} className="block h-full group">
      <Card className="flex flex-col w-full h-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white border-none rounded-xl">
        {/* Top Section: Media Slot (Fixed Aspect Ratio) */}
        <div className="relative w-full aspect-video bg-muted/20">
          {mainImageUrl ? (
            isVideo(mainImageUrl) ? (
              <div className="h-full w-full flex items-center justify-center bg-slate-900">
                <Play className="h-10 w-10 text-white opacity-40" />
                <span className="absolute bottom-2 right-2 text-[8px] font-bold text-white uppercase bg-black/40 px-1.5 py-0.5 rounded">Video</span>
              </div>
            ) : isAudio(mainImageUrl) ? (
              <div className="h-full w-full flex items-center justify-center bg-slate-100">
                <Mic className="h-10 w-10 text-primary opacity-40" />
                <span className="absolute bottom-2 right-2 text-[8px] font-bold text-slate-500 uppercase bg-black/5 px-1.5 py-0.5 rounded">Audio</span>
              </div>
            ) : (
              <Image
                src={mainImageUrl}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                unoptimized
              />
            )
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-primary/5">
               <Skeleton className="h-full w-full" />
            </div>
          )}
          
          <Badge className="absolute top-3 right-3 bg-primary text-white uppercase font-black text-[9px] tracking-widest border-none shadow-md">
            {post.category}
          </Badge>
        </div>

        {/* Bottom Section: Details Slot */}
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
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 border-2 border-white shadow-sm">
                <AvatarImage src={author?.photoURL} />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold uppercase">
                  {post.authorName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tight truncate max-w-[80px]">
                {post.authorName}
              </span>
            </div>
            
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
