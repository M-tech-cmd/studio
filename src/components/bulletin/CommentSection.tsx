
'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { BulletinComment } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { AddCommentForm } from "./AddCommentForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthorBadge } from "../shared/AuthorBadge";

function Comment({ comment }: { comment: BulletinComment }) {
    return (
        <div className="flex space-x-3">
            <div className="flex-shrink-0">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={comment.authorPhotoUrl} alt={comment.authorName} />
                    <AvatarFallback>{comment.authorName ? comment.authorName.charAt(0).toUpperCase() : 'A'}</AvatarFallback>
                </Avatar>
            </div>
            <div className="flex-grow bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                    <AuthorBadge userId={comment.authorId} fallbackName={comment.authorName} />
                    <p className="text-[10px] text-muted-foreground">
                        {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : ''}
                    </p>
                </div>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{comment.content}</p>
            </div>
        </div>
    );
}


export function CommentSection({ postId }: { postId: string }) {
    const firestore = useFirestore();
    
    const commentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'bulletins', postId, 'comments'), orderBy('createdAt', 'desc'));
    }, [firestore, postId]);

    const { data: comments, isLoading } = useCollection<BulletinComment>(commentsQuery);

    return (
        <div className="space-y-6">
            {isLoading && (
                <div className="space-y-4 pt-4 border-t">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            )}
            {!isLoading && comments && comments.length > 0 && (
                 <div className="space-y-4">
                    {comments.map(comment => <Comment key={comment.id} comment={comment} />)}
                </div>
            )}
             {!isLoading && (!comments || comments.length === 0) && (
                <p className="text-center text-sm text-muted-foreground py-8 italic">No reflections shared yet. Be the first to comment.</p>
            )}
            <AddCommentForm postId={postId} />
        </div>
    )
}
