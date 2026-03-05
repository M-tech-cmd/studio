
'use client';

import Link from 'next/link';
import type { BulletinPost } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Heart, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AuthorBadge } from '../shared/AuthorBadge';
import { Button } from '../ui/button';

export function BulletinPostCard({ post }: { post: BulletinPost }) {
  const reactionCount = Object.keys(post.reactions || {}).length;

  const contentSnippet = post.content.replace(/<[^>]+>/g, '').substring(0, 200) + '...';

  return (
    <Link href={`/bulletin/${post.id}`} className="block group">
      <Card className="hover:border-primary transition-all hover:shadow-md border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-headline group-hover:text-primary transition-colors">{post.title}</CardTitle>
          <div className="flex items-center gap-2 mt-1">
            <AuthorBadge userId={post.authorId} fallbackName={post.authorName} />
            <span className="text-[10px] text-muted-foreground">•</span>
            <span className="text-[10px] text-muted-foreground">
                {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : ''}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground line-clamp-3" dangerouslySetInnerHTML={{ __html: contentSnippet }} />
        </CardContent>
        <CardFooter className="flex justify-between items-center bg-muted/5 py-3 border-t">
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5" />
              <span>{reactionCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="group-hover:text-primary transition-colors font-bold">Read More</span>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase opacity-70">{post.category}</Badge>
        </CardFooter>
      </Card>
    </Link>
  );
}
