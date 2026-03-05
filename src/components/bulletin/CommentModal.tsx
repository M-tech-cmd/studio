
'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BulletinPost } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommentSection } from "./CommentSection";
import { MessageCircle } from 'lucide-react';

export function CommentModal({ post }: { post: BulletinPost }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Comment
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>Comments on "{post.title}"</DialogTitle>
                </DialogHeader>
                <div className="flex-grow overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="pr-6 pl-6 pb-6">
                            <Card className="border-none shadow-none mb-6">
                                <CardHeader className="p-0">
                                    <Badge variant="secondary" className="w-fit">{post.category}</Badge>
                                    <CardTitle className="text-2xl !mt-2">{post.title}</CardTitle>
                                    <CardDescription>
                                        Posted by {post.authorName} on {post.createdAt ? format(post.createdAt.toDate(), 'MMMM d, yyyy') : ''}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 mt-4 space-y-6">
                                    <div className="prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: post.content }} />
                                </CardContent>
                            </Card>

                            <CommentSection postId={post.id} />
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
