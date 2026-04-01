'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '../ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Send, X } from 'lucide-react';
import type { BulletinComment } from '@/lib/types';

const commentSchema = z.object({
    content: z.string().min(1, 'Reflection cannot be empty.').max(500, 'Reflection is too long.'),
});

interface AddCommentFormProps {
    postId: string;
    replyTo?: BulletinComment | null;
    onCancelReply?: () => void;
}

const ADMIN_UID = 'BKSmmIdohYQHlao5V9eZ9JQyaEV2';

export function AddCommentForm({ postId, replyTo, onCancelReply }: AddCommentFormProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<z.infer<typeof commentSchema>>({
        resolver: zodResolver(commentSchema),
        defaultValues: { content: '' },
    });

    const getPlaceholder = () => {
        if (!replyTo) return "Write a reflection...";
        
        // Specific case: Replying to an official post
        if (replyTo.authorId === ADMIN_UID) {
            return "Reply to St. Martin De Porres Admin...";
        }
        
        // Standard member reply
        return `Reply to ${replyTo.authorName}...`;
    };

    const onSubmit = async (values: z.infer<typeof commentSchema>) => {
        if (!user || !firestore) return;

        let finalContent = values.content;

        // Auto-associate mention if it's a reply
        if (replyTo) {
            const handle = replyTo.authorId === ADMIN_UID 
                ? "@St. Martin Admin" 
                : `@${replyTo.authorName.replace(/\s+/g, '')}`;
            
            // Prepend the mention if the user hasn't already typed it
            if (!finalContent.startsWith(handle)) {
                finalContent = `${handle} ${finalContent}`;
            }
        }

        const commentData = {
            postId,
            authorId: user.uid,
            authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
            authorPhotoUrl: user.photoURL || '',
            content: finalContent,
            parentId: replyTo ? replyTo.id : null,
            createdAt: serverTimestamp(),
            reactions: {},
        };

        try {
            await addDoc(collection(firestore, 'bulletins', postId, 'comments'), commentData);
            form.reset();
            if (onCancelReply) onCancelReply();
            toast({ title: 'Reflection posted!' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Failed to post reflection.' });
        }
    };

    if (!user) {
        return (
            <div className="text-center p-8 bg-muted/10 rounded-2xl border-2 border-dashed">
                <Button onClick={() => router.push('/login')} variant="outline" className="rounded-full h-12 px-8 font-bold">
                    Sign in to join the conversation
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {replyTo && (
                <div className="flex items-center justify-between bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 animate-in slide-in-from-bottom-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Send className="h-3 w-3 rotate-45" />
                        Replying to {replyTo.authorId === ADMIN_UID ? 'St. Martin Admin' : replyTo.authorName}
                    </p>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                        onClick={onCancelReply}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 mt-1 border border-primary/10">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'user'} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="relative w-full">
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea 
                                            placeholder={getPlaceholder()} 
                                            {...field} 
                                            className="pr-14 min-h-[50px] rounded-2xl border-2 focus-visible:ring-primary shadow-sm bg-white"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button 
                            type="submit" 
                            size="icon" 
                            className="absolute bottom-2 right-2 h-9 w-9 rounded-full shadow-lg hover:scale-110 transition-transform active:scale-95" 
                            disabled={form.formState.isSubmitting || !form.watch('content').trim()}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
