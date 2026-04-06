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
import { MoreHorizontal, Pencil, Trash2, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
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
 */
function CommentContent({ content }: { content: string }) {
    if (!content) return null;
    const parts = content.split(/(@[^\s]+)/g);
    return (
        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
            {parts.map((part, index) => {
                if (part.startsWith('@') && part.length > 1) {
                    return (
                        <span key={index} className="text-blue-600 font-semibold bg-blue-50/50 px-1 rounded-sm cursor-default hover:underline transition-all">
                            {part}
                        </span>
                    );
                }
                return part;
            })}
        </p>
    );
}

function Comment({ 
    comment, 
    postId, 
    onReply,
    isReply = false
}: { 
    comment: BulletinComment; 
    postId: string;
    onReply: (c: BulletinComment) => void;
    isReply?: boolean;
}) {
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
            toast({ title: "Sign in required", description: "Login to react." });
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
        } catch (error) { console.error(error); }
    };

    const reactionCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        Object.values(reactions).forEach(emoji => { counts[emoji] = (counts[emoji] || 0) + 1; });
        return counts;
    }, [reactions]);

    const topEmojis = useMemo(() => {
        return Object.entries(reactionCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([emoji]) => emoji);
    }, [reactionCounts]);

    return (
        <div className={cn("flex space-x-3 group/comment", isReply && "scale-95 origin-left")}>
            <div className="flex-shrink-0">
                <Avatar className={cn("border border-primary/10", isReply ? "h-8 w-8" : "h-10 w-10")}>
                    <AvatarImage src={comment.authorPhotoUrl} alt={comment.authorName} />
                    <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs">
                        {comment.authorName ? comment.authorName.charAt(0).toUpperCase() : 'A'}
                    </AvatarFallback>
                </Avatar>
            </div>
            <div className="flex-grow space-y-1">
                <div className="relative inline-block max-w-full">
                    <div className={cn(
                        "bg-muted rounded-2xl p-3 pr-10 min-w-[140px]",
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
                                <Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="min-h-[80px] bg-white border-primary/20" autoFocus />
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button size="sm" onClick={handleUpdate}>Save</Button>
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
                                        <DropdownMenuItem onClick={() => setIsEditing(true)} className="gap-2 font-bold cursor-pointer"><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="gap-2 font-bold text-destructive cursor-pointer"><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>

                    {Object.keys(reactions).length > 0 && !isEditing && (
                        <div className="absolute -bottom-2 -right-2 flex items-center gap-1 bg-white shadow-md border rounded-full px-1.5 py-0.5 z-10 animate-in zoom-in">
                            <div className="flex -space-x-1">
                                {topEmojis.map(emoji => (
                                    <span key={emoji} className="text-[10px] drop-shadow-sm">{emoji}</span>
                                ))}
                            </div>
                            <span className="text-[10px] font-black text-muted-foreground pr-0.5">{Object.keys(reactions).length}</span>
                        </div>
                    )}
                </div>

                {!isEditing && (
                    <div className="flex items-center gap-4 ml-2 mt-1">
                        <Popover open={isReactionPickerOpen} onOpenChange={setIsReactionPickerOpen}>
                            <PopoverTrigger asChild>
                                <button 
                                    className={cn("text-xs font-black uppercase tracking-widest hover:underline transition-colors", userReaction ? "text-primary" : "text-muted-foreground")}
                                    onClick={() => !userReaction && toggleReaction('👍')}
                                >
                                    {userReaction ? `Reacted ${userReaction}` : 'Like'}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent side="top" align="start" className="w-auto p-1.5 rounded-full shadow-2xl border-2 animate-in slide-in-from-bottom-2" sideOffset={10}>
                                <div className="flex gap-1">
                                    {EMOJIS.map(emoji => (
                                        <button key={emoji} onClick={() => toggleReaction(emoji)} className="text-2xl hover:scale-125 transition-transform p-1.5 active:scale-95">{emoji}</button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        <button onClick={() => onReply(comment)} className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:underline">Reply</button>
                    </div>
                )}
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black">Delete Reflection?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently remove your comment.</AlertDialogDescription>
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
    const [replyingTo, setReplyingTo] = useState<BulletinComment | null>(null);
    const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
    
    const commentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'bulletins', postId, 'comments'), orderBy('createdAt', 'asc'));
    }, [firestore, postId]);

    const { data: allComments, isLoading } = useCollection<BulletinComment>(commentsQuery);

    const { topLevelComments, repliesMap } = useMemo(() => {
        if (!allComments) return { topLevelComments: [], repliesMap: {} };
        const top = allComments.filter(c => !c.parentId);
        const map: Record<string, BulletinComment[]> = {};
        allComments.forEach(c => {
            if (c.parentId) {
                if (!map[c.parentId]) map[c.parentId] = [];
                map[c.parentId].push(c);
            }
        });
        return { topLevelComments: top, repliesMap: map };
    }, [allComments]);

    const toggleThread = (id: string) => {
        setExpandedThreads(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="space-y-8">
            {isLoading && (
                <div className="space-y-4 pt-4 border-t">
                    <Skeleton className="h-16 w-full rounded-2xl" />
                    <Skeleton className="h-16 w-full rounded-2xl" />
                </div>
            )}
            {!isLoading && topLevelComments.length > 0 && (
                 <div className="space-y-8">
                    {topLevelComments.map(comment => {
                        const threadReplies = repliesMap[comment.id] || [];
                        const isExpanded = expandedThreads[comment.id];
                        const isReplyingToThis = replyingTo?.id === comment.id || threadReplies.some(r => r.id === replyingTo?.id);

                        return (
                            <div key={comment.id} className="space-y-4">
                                <Comment 
                                    comment={comment} 
                                    postId={postId} 
                                    onReply={setReplyingTo}
                                />

                                {threadReplies.length > 0 && (
                                    <button 
                                        onClick={() => toggleThread(comment.id)}
                                        className="ml-12 text-xs text-primary font-black uppercase tracking-widest flex items-center gap-2 hover:underline"
                                    >
                                        <MessageCircle className="h-3 w-3" />
                                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                        {threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}
                                    </button>
                                )}

                                {isExpanded && threadReplies.length > 0 && (
                                    <div className="ml-10 pl-4 border-l-2 border-primary/20 space-y-4 mt-3 animate-in slide-in-from-left-2">
                                        {threadReplies.map(reply => (
                                            <Comment 
                                                key={reply.id} 
                                                comment={reply} 
                                                postId={postId} 
                                                onReply={setReplyingTo}
                                                isReply
                                            />
                                        ))}
                                    </div>
                                )}

                                {isReplyingToThis && (
                                    <div className="ml-12 mt-4 p-4 bg-muted/30 rounded-2xl border-2 border-dashed animate-in zoom-in-95">
                                        <AddCommentForm 
                                            postId={postId} 
                                            replyTo={replyingTo} 
                                            onCancelReply={() => setReplyingTo(null)}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
             {!isLoading && topLevelComments.length === 0 && (
                <div className="text-center py-12 bg-muted/5 rounded-[2rem] border-2 border-dashed">
                    <MessageCircle className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No reflections shared yet</p>
                </div>
            )}
            {!replyingTo && (
                <div className="pt-6 border-t border-dashed">
                    <AddCommentForm 
                        postId={postId} 
                        onCancelReply={() => setReplyingTo(null)}
                    />
                </div>
            )}
        </div>
    )
}
