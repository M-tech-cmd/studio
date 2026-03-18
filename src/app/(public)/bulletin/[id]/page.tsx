
'use client';

import { useParams, useRouter } from 'next/navigation';
import React from 'react';
import dynamic from 'next/dynamic';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { BulletinPost } from '@/lib/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Reactions } from '@/components/bulletin/Reactions';
import { CommentSection } from '@/components/bulletin/CommentSection';
import { AuthorBadge } from '@/components/shared/AuthorBadge';
import Link from 'next/link';

const PhotoGallery = dynamic(() => import('@/components/shared/PhotoGallery').then(mod => mod.PhotoGallery), {
  ssr: false,
  loading: () => <div className="h-48 w-full animate-pulse bg-muted rounded-2xl" />
});

export default function BulletinPostPage() {
  const params = useParams();
  const id = params?.id as string;
  const firestore = useFirestore();
  const router = useRouter();
  
  const postRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'bulletins', id);
  }, [firestore, id]);

  const { data: post, isLoading } = useDoc<BulletinPost>(postRef);

  if (isLoading) {
    return (
        <div className="bg-transparent">
            <PageHeader title="..." subtitle="..." />
            <section className="py-16">
                <div className="container max-w-4xl mx-auto px-4 space-y-8">
                    <Skeleton className="h-10 w-48" />
                    <Card className="border-none shadow-xl"><CardContent className="p-8"><Skeleton className="h-96 w-full" /></CardContent></Card>
                </div>
            </section>
        </div>
    );
  }

  if (!post && !isLoading) {
    return (
        <div className="bg-transparent min-h-screen flex flex-col items-center justify-center p-4">
            <Info className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
            <h1 className="text-2xl font-black">ANNOUNCEMENT NOT FOUND</h1>
            <p className="text-muted-foreground mt-2 text-center max-w-xs">This post may have been removed or updated by an administrator.</p>
            <Button asChild variant="outline" className="mt-8 rounded-full">
                <Link href="/bulletin">Return to Feed</Link>
            </Button>
        </div>
    );
  }

  if (!post) return null;

  return (
    <div className="bg-transparent pb-20 animate-in fade-in duration-700">
      <PageHeader title={post.title} subtitle={`Community Update`} />
      <section className="py-8">
        <div className="container max-w-4xl mx-auto px-4 space-y-10">
            <Button asChild variant="ghost" className="hover:bg-primary/10 rounded-full group">
                <Link href="/bulletin">
                    <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"/> 
                    Back to Bulletin
                </Link>
            </Button>
            
            <Card className="border-none shadow-2xl bg-card overflow-hidden rounded-2xl">
                <CardHeader className="bg-muted/10 border-b p-8 md:p-12">
                    <Badge variant="secondary" className="w-fit mb-6 px-4 py-1 uppercase tracking-widest text-[10px] font-black">{post.category}</Badge>
                    <CardTitle className="text-4xl lg:text-6xl font-black tracking-tight !mt-0 leading-[1.1]">{post.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-6 mt-10">
                        <AuthorBadge userId={post.authorId} fallbackName={post.authorName} className="scale-125 origin-left" />
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-bold border-l pl-6">
                            <Calendar className="h-4 w-4 text-primary" />
                            {post.createdAt ? format(post.createdAt.toDate(), 'MMMM d, yyyy') : ''}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 md:p-12">
                    <div 
                        className="prose prose-lg md:prose-xl dark:prose-invert max-w-none text-foreground/90 leading-relaxed first-letter:text-5xl first-letter:font-black first-letter:text-primary first-letter:mr-2" 
                        dangerouslySetInnerHTML={{ __html: post.content }} 
                    />
                    
                    <div className="mt-12 pt-12 border-t border-dashed">
                        <PhotoGallery photos={post.galleryImages} title={post.title} />
                    </div>
                </CardContent>
                <CardFooter className="p-8 md:p-12 bg-muted/5 border-t flex flex-col gap-10">
                   <div className="space-y-4">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Community Reactions</p>
                        <Reactions post={post} postId={id} />
                   </div>
                   
                   <div className="pt-10 border-t border-dashed">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black tracking-tighter uppercase">Parishioner Reflections</h3>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Support Area</p>
                        </div>
                        <CommentSection postId={id} />
                   </div>
                </CardFooter>
            </Card>
        </div>
      </section>
    </div>
  );
}
