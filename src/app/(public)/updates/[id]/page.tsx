
'use client';

import { useParams, notFound } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { BulletinPost } from '@/lib/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Reactions } from '@/components/bulletin/Reactions';
import { CommentModal } from '@/components/bulletin/CommentModal';
import { AuthorBadge } from '@/components/shared/AuthorBadge';
import Link from 'next/link';

export default function BulletinPostPage() {
  const params = useParams();
  const id = params?.id as string;
  const firestore = useFirestore();
  
  const postRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'bulletins', id);
  }, [firestore, id]);

  const { data: post, isLoading } = useDoc<BulletinPost>(postRef);

  if (isLoading) {
    return (
        <div>
            <PageHeader title="..." subtitle="..." />
            <section className="py-16">
                <div className="container max-w-4xl mx-auto px-4 space-y-8">
                    <Skeleton className="h-10 w-48" />
                    <Card><CardContent className="p-8"><Skeleton className="h-96 w-full" /></CardContent></Card>
                </div>
            </section>
        </div>
    );
  }

  if (!post && !isLoading) {
    notFound();
  }

  if (!post) return null;

  return (
    <div className="bg-transparent pb-20">
      <PageHeader title={post.title} subtitle={`Community Update`} />
      <section className="py-8">
        <div className="container max-w-4xl mx-auto px-4 space-y-8">
            <Button asChild variant="ghost" className="hover:bg-primary/10">
                <Link href="/updates"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Updates Feed</Link>
            </Button>
            <Card className="border-none shadow-xl bg-card overflow-hidden">
                <CardHeader className="bg-muted/20 border-b p-8">
                    <Badge variant="secondary" className="w-fit mb-4">{post.category}</Badge>
                    <CardTitle className="text-4xl lg:text-5xl font-black tracking-tight !mt-0 leading-tight">{post.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-4 mt-6">
                        <AuthorBadge userId={post.authorId} fallbackName={post.authorName} className="scale-110 origin-left" />
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                            <Calendar className="h-4 w-4 text-primary" />
                            {post.createdAt ? format(post.createdAt.toDate(), 'MMMM d, yyyy') : ''}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 pt-10">
                    <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/80 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
                </CardContent>
                <CardFooter className="p-8 bg-muted/10 border-t flex flex-col sm:flex-row justify-between items-center gap-6">
                   <Reactions post={post} postId={id} />
                   <div className="flex items-center gap-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Share your thoughts:</p>
                        <CommentModal post={post} />
                   </div>
                </CardFooter>
            </Card>
        </div>
      </section>
    </div>
  );
}
