
'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Hand, Sparkles } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import type { BulletinPost, ReactionType } from '@/lib/types';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function Reactions({ post, postId }: { post: BulletinPost; postId: string }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const reactions = post.reactions || {};
    const userReaction = user ? reactions[user.uid] : null;

    const handleReaction = async (reaction: ReactionType) => {
        if (!user) {
            toast({ title: "Sign in required", description: "You must be logged in to react to posts." });
            router.push('/login');
            return;
        }
        if (!firestore) return;

        const postRef = doc(firestore, 'bulletins', postId);

        if (userReaction === reaction) {
            // User is un-reacting
            updateDoc(postRef, {
                [`reactions.${user.uid}`]: deleteField()
            });
        } else {
            // User is reacting or changing reaction
            updateDoc(postRef, {
                [`reactions.${user.uid}`]: reaction
            });
        }
    };

    const reactionCounts = useMemo(() => {
        const counts: { [key in ReactionType]: number } = { amen: 0, blessed: 0, hallelujah: 0 };
        for (const uid in reactions) {
            const reactionType = reactions[uid];
            if (counts[reactionType] !== undefined) {
                counts[reactionType]++;
            }
        }
        return counts;
    }, [reactions]);

    const reactionConfig: { type: ReactionType; icon: React.ElementType; color: string, label: string, emoji: string }[] = [
        { type: 'amen', icon: Hand, color: 'text-amber-500', label: 'Amen', emoji: '🙏' },
        { type: 'blessed', icon: Heart, color: 'text-red-500', label: 'Blessed', emoji: '❤️' },
        { type: 'hallelujah', icon: Sparkles, color: 'text-blue-500', label: 'Hallelujah', emoji: '🙌' },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {reactionConfig.map(({ type, icon: Icon, color, label, emoji }) => (
                <Button 
                    key={type} 
                    variant={userReaction === type ? 'secondary' : 'outline'} 
                    size="sm" 
                    onClick={() => handleReaction(type)}
                    className={cn(
                        "flex items-center gap-2 rounded-full px-4 border-none shadow-sm transition-all hover:scale-105",
                        userReaction === type ? "bg-muted shadow-inner" : "bg-white"
                    )}
                >
                    <span className="text-lg">{emoji}</span>
                    <span className={cn("text-xs font-bold uppercase tracking-wider", userReaction === type ? color : "text-muted-foreground")}>
                        {label}
                    </span>
                    {reactionCounts[type] > 0 && (
                        <span className="ml-1 text-xs font-black opacity-60">
                            {reactionCounts[type]}
                        </span>
                    )}
                </Button>
            ))}
        </div>
    );
}
