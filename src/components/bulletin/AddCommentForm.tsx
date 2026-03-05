
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
import { Send } from 'lucide-react';

const commentSchema = z.object({
    content: z.string().min(1, 'Comment cannot be empty.').max(500, 'Comment is too long.'),
});

export function AddCommentForm({ postId }: { postId: string }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<z.infer<typeof commentSchema>>({
        resolver: zodResolver(commentSchema),
        defaultValues: { content: '' },
    });

    const onSubmit = async (values: z.infer<typeof commentSchema>) => {
        if (!user || !firestore) return;

        const commentData = {
            postId,
            authorId: user.uid,
            authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
            authorPhotoUrl: user.photoURL || '',
            content: values.content,
            createdAt: serverTimestamp(),
        };

        try {
            await addDoc(collection(firestore, 'bulletins', postId, 'comments'), commentData);
            form.reset();
            toast({ title: 'Comment posted!' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Failed to post comment.' });
        }
    };

    if (!user) {
        return (
            <div className="text-center p-4 border-t">
                <Button onClick={() => router.push('/login')}>
                    Sign in to leave a comment
                </Button>
            </div>
        );
    }

    return (
        <div className="pt-4 border-t">
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 mt-1">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'user'} />
                        <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}</AvatarFallback>
                    </Avatar>
                    <div className="relative w-full">
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea placeholder="Write a comment..." {...field} className="pr-12 min-h-[40px]"/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" size="icon" className="absolute top-1/2 right-2 -translate-y-1/2 h-8 w-8" disabled={form.formState.isSubmitting}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
