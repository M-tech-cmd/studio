
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useAuth } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc, deleteDoc, deleteField, serverTimestamp } from "firebase/firestore";
import type { BulletinComment } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { AddCommentForm } from "./AddCommentForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthorBadge } from "../shared/AuthorBadge";
import { Button } from "../ui/button";
import { MoreHorizontal, Pencil, Trash2, Heart, MessageCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "../ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

/**
 * Renders comment text with professional @mention highlighting.
 * Differentiates between the mention handle and the actual message content.
 */
function CommentContent({ content }: { content: string }) {
    if (!content) return null;

    // Split by words while preserving spaces/newlines
    const parts = content.split(/(\s+)/);

    return (
        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
            {parts.map((part, index) => {
                // If part starts with @ and has content after it
                if (part.startsWith('@') && part.length > 1) {
                    return (
                        <span 
                            key={index} 
                            className="text-primary font-semibold bg-primary/5 px-1 rounded-sm cursor-pointer hover:underline decoration-primary/30 transition-all"
                        >
                            {part}
                        </span>
                    );
                }
                return part;
            })}
        </p>
    );
}

function Comment({ comment, postId }: { comment: BulletinComment; postId: string }) {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(comment.content);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);

    const isOwner = user?.uid === comment.authorId;
    const reactions = comment.reactions || {};
    const userReaction = user ? reactions[user.uid] : null;

    const handleUpdate = async () => {
        if (!firestore || !editValue.trim()) return;
        const commentRef = doc(firestore, 'bulletins', postId, 'comments', comment.id);
        try {
            await updateDoc(commentRef, { 
                content: editValue,
                updatedAt: serverTimestamp() 
            });
            setIsEditing(false);
            toast({ title: "Reflection updated" });
        } catch (error) {
            toast({ variant: "destructive", title: "Update failed" });
        }
    };

    const handleDelete = async () => {
        if (!firestore) return;
        const commentRef = doc(firestore, 'bulletins', postId, 'comments', comment.id);
        try {
            await deleteDoc(commentRef);
            toast({ title: "Reflection removed" });
        } catch (error) {
            toast({ variant: "destructive", title: "Delete failed" });
        }
    };

    const toggleReaction = async (emoji: string) => {
        if (!user || !firestore) {
            toast({ title: "Sign in required", description: "Login to react to reflections." });
            return;
        }
        const commentRef = doc(firestore, 'bulletins', postId, 'comments', comment.id);
        
        try {
            if (userReaction === emoji) {
                await updateDoc(commentRef, { [`reactions.${user.uid}`]: deleteField() });
            } else {
                await updateDoc(commentRef, { [`reactions.${user.uid}`]: emoji });
            }
            setIsReactionPickerOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    const reactionCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        Object.values(reactions).forEach(emoji => {
            counts[emoji] = (counts[emoji] || 0) + 1;
        });
        return counts;
    }, [reactions]);

    const topEmojis = useMemo(() => {
        return Object.entries(reactionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([emoji]) => emoji);
    }, [reactionCounts]);

    const totalReactions = Object.keys(reactions).length;

    return (
        <div className="flex space-x-3 group/comment">
            <div className="flex-shrink-0">
                <Avatar className="h-10 w-10 border border-primary/10">
                    <AvatarImage src={comment.authorPhotoUrl} alt={comment.authorName} />
                    <AvatarFallback className="bg-primary/5 text-primary font-bold">
                        {comment.authorName ? comment.authorName.charAt(0).toUpperCase() : 'A'}
                    </AvatarFallback>
                </Avatar>
            </div>
            <div className="flex-grow space-y-1">
                <div className="relative inline-block max-w-full">
                    <div className={cn(
                        "bg-muted rounded-2xl p-3 pr-10 min-w-[120px]",
                        isEditing && "w-full min-w-[300px]"
                    )}>
                        <div className="flex items-center gap-2 mb-1">
                            <AuthorBadge userId={comment.authorId} fallbackName={comment.authorName} />
                            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">
                                {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : ''}
                            </p>
                        </div>
                        
                        {isEditing ? (
                            <div className="space-y-3 mt-2">
                                <Textarea 
                                    value={editValue} 
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="min-h-[80px] bg-white border-primary/20"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button size="sm" onClick={handleUpdate}>Save Changes</Button>
                                </div>
                            </div>
                        ) : (
                            <CommentContent content={comment.content} />
                        )}

                        {isOwner && !isEditing && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-2">
                                        <DropdownMenuItem onClick={() => setIsEditing(true)} className="gap-2 font-bold cursor-pointer">
                                            <Pencil className="h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="gap-2 font-bold text-destructive focus:text-destructive cursor-pointer">
                                            <Trash2 className="h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>

                    {totalReactions > 0 && !isEditing && (
                        <div className="absolute -bottom-2 -right-2 flex items-center gap-1 bg-white shadow-md border rounded-full px-1.5 py-0.5 z-10 animate-in zoom-in">
                            <div className="flex -space-x-1">
                                {topEmojis.map(emoji => (
                                    <span key={emoji} className="text-[10px] drop-shadow-sm">{emoji}</span>
                                ))}
                            </div>
                            <span className="text-[10px] font-black text-muted-foreground pr-0.5">{totalReactions}</span>
                        </div>
                    )}
                </div>

                {!isEditing && (
                    <div className="flex items-center gap-4 ml-2 mt-1">
                        <Popover open={isReactionPickerOpen} onOpenChange={setIsReactionPickerOpen}>
                            <PopoverTrigger asChild>
                                <button 
                                    className={cn(
                                        "text-xs font-black uppercase tracking-widest hover:underline transition-colors",
                                        userReaction ? "text-primary" : "text-muted-foreground"
                                    )}
                                    onClick={() => !userReaction && toggleReaction('👍')}
                                >
                                    {userReaction ? `Reacted ${userReaction}` : 'Like'}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent 
                                side="top" 
                                align="start" 
                                className="w-auto p-1.5 rounded-full shadow-2xl border-2 animate-in slide-in-from-bottom-2"
                                sideOffset={10}
                            >
                                <div className="flex gap-1">
                                    {EMOJIS.map(emoji => (
                                        <button 
                                            key={emoji} 
                                            onClick={() => toggleReaction(emoji)}
                                            className="text-2xl hover:scale-125 transition-transform p-1.5 active:scale-95"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        <button className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:underline">
                            Reply
                        </button>
                    </div>
                )}
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">Delete Reflection?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove your comment from the bulletin thread. This action is final.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white rounded-full">Yes, Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export function CommentSection({ postId }: { postId: string }) {
    const firestore = useFirestore();
    
    const commentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'bulletins', postId, 'comments'), orderBy('createdAt', 'asc'));
    }, [firestore, postId]);

    const { data: comments, isLoading } = useCollection<BulletinComment>(commentsQuery);

    return (
        <div className="space-y-8">
            {isLoading && (
                <div className="space-y-4 pt-4 border-t">
                    <Skeleton className="h-16 w-full rounded-2xl" />
                    <Skeleton className="h-16 w-full rounded-2xl" />
                </div>
            )}
            {!isLoading && comments && comments.length > 0 && (
                 <div className="space-y-6">
                    {comments.map(comment => <Comment key={comment.id} comment={comment} postId={postId} />)}
                </div>
            )}
             {!isLoading && (!comments || comments.length === 0) && (
                <div className="text-center py-12 bg-muted/5 rounded-[2rem] border-2 border-dashed">
                    <MessageCircle className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No reflections shared yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Be the first to share your thoughts with the community.</p>
                </div>
            )}
            <div className="pt-6 border-t border-dashed">
                <AddCommentForm postId={postId} />
            </div>
        </div>
    )
}
