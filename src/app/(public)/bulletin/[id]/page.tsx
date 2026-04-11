'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { BulletinPost, RegisteredUser } from '@/lib/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Info, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

const roleMapping: Record<string, string> = {
    admin: "St. Martin De Porres Admin",
    chairman: "St. Martin De Porres Chairman",
    treasurer: "St. Martin De Porres Treasurer",
    secretary: "St. Martin De Porres Secretary",
    tech_dev: "St. Martin De Porres Tech/Dev",
};

const PhotoGallery = dynamic(() => import('@/components/shared/PhotoGallery').then(mod => mod.PhotoGallery), {
  ssr: false,
  loading: () => <div className="h-48 w-full animate-pulse bg-muted rounded-2xl" />
});

const CommentSection = dynamic(
  () => import('@/components/bulletin/CommentSection').then(
    m => m.CommentSection
  ),
  { 
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4 mt-8">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-20 bg-muted rounded" />
        <div className="h-20 bg-muted rounded" />
      </div>
    )
  }
);

export default function BulletinPostPage() {
  const params = useParams();
  const id = params?.id as string;
  const firestore = useFirestore();
  
  const postRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'bulletins', id);
  }, [firestore, id]);

  const { data: post, isLoading } = useDoc<BulletinPost>(postRef);

  // Fetch Author Profile to resolve official role
  const authorRef = useMemoFirebase(() => {
    if (!firestore || !post?.authorId) return null;
    return doc(firestore, 'users', post.authorId);
  }, [firestore, post?.authorId]);

  const { data: author, isLoading: authorLoading } = useDoc<RegisteredUser>(authorRef);

  /**
   * Title Case Role Mapping
   */
  const displayAuthorTitle = useMemo(() => {
    if (authorLoading) return "Loading...";
    if (!author) return "St. Martin De Porres Admin";
    
    const isAdmin = author.isAdmin === true || author.role !== 'user';
    if (isAdmin) {
        return roleMapping[author.role] || "St. Martin De Porres Admin";
    }
    return author.name || "Parish Member";
  }, [author, authorLoading]);

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
            <h1 className="text-2xl font-black uppercase">Post Not Found</h1>
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
        <div className="container max-w-24xl mx-auto px-4 space-y-10">
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
                        {/* Refined Official Author Display */}
                        <div className="flex items-center gap-3 bg-white/50 px-4 py-2 rounded-full border border-primary/10 shadow-sm transition-all hover:bg-white hover:shadow-md">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground leading-none mb-1">Official Author</span>
                                <span className="font-bold text-sm text-primary leading-none tracking-tight">
                                    {displayAuthorTitle}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-bold border-l pl-6">
                            <Calendar className="h-4 w-4 text-primary" />
                            {post.createdAt ? format(post.createdAt.toDate(), 'MMMM d, yyyy') : ''}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 md:p-12">
                    {/* Content Area - Images embedded here will be the only ones shown */}
                    <div 
                        className="prose prose-lg md:prose-xl dark:prose-invert max-w-none text-foreground/90 leading-relaxed" 
                        dangerouslySetInnerHTML={{ __html: post.content }} 
                    />
                    
                    <div className="mt-12 pt-12 border-t border-dashed">
                        <PhotoGallery photos={post.galleryImages} title={post.title} />
                    </div>
                </CardContent>
                <CardFooter className="p-8 md:p-12 bg-muted/5 border-t">   
                   <div className="w-full">
                        <h3 className="text-2xl font-black tracking-tighter uppercase mb-8">Reflections</h3>
                        <CommentSection postId={id} />
                   </div>
                </CardFooter>
            </Card>
        </div>
      </section>
    </div>
  );
}
