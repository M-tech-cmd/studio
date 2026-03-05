
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from "@/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import type { Conversation } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { MessageSquare, Clock, User, ShieldCheck, Inbox, ArrowRight, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

/**
 * Admin Inbox: Real-time high-priority listener.
 * Synchronized with 'private_chats' collection to capture all parishioner inquiries instantly.
 * Updated to ensure robust real-time synchronization and bypass any previous permission blocks.
 */
export default function AdminMessagesPage() {
    const firestore = useFirestore();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!firestore) return;

        console.log("Admin Bridge: Initiating global onSnapshot sync for 'private_chats'...");
        const chatsRef = collection(firestore, 'private_chats');
        
        // Watch the entire private_chats collection for any updates, ordered by most recent
        const q = query(chatsRef, orderBy('updatedAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snap) => {
            console.log(`Admin Bridge: Received real-time update with ${snap.size} threads.`);
            const data: Conversation[] = [];
            snap.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() } as Conversation);
            });
            setConversations(data);
            setIsLoading(false);
        }, (error) => {
            console.error("Admin Bridge Sync Critical Error:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [firestore]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase">PARISHIONER INBOX</h1>
                    <p className="text-muted-foreground font-medium">Real-time communication bridge with members.</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-widest border border-primary/20">
                    <ShieldCheck className="h-3 w-3" />
                    Secure Bridge Sync Active
                </div>
            </div>

            <Card className="border-none shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="bg-primary/5 border-b py-4 flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Active Inquiries ({conversations.length})
                    </CardTitle>
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            <Skeleton className="h-24 w-full rounded-2xl" />
                            <Skeleton className="h-24 w-full rounded-2xl" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="p-24 text-center text-muted-foreground">
                            <div className="bg-muted/20 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Inbox className="h-12 w-12 opacity-30" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight text-foreground/80">Inbox Empty</h3>
                            <p className="text-sm mt-3 max-w-xs mx-auto font-medium leading-relaxed">
                                No parishioner inquiries have been detected in the 'private_chats' collection.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {conversations.map((conv) => {
                                const parishionerId = conv.participants.find(p => p !== 'parish_office');
                                const parishionerName = conv.participantNames?.[parishionerId || ''] || 'Parish Member';

                                return (
                                    <Link key={conv.id} href={`/admin/messages/${conv.id}`} className="block hover:bg-primary/5 transition-all group">
                                        <div className="p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-5">
                                                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20 shadow-sm group-hover:scale-105 transition-transform">
                                                    <User className="h-7 w-7" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className="font-black text-xl leading-none group-hover:text-primary transition-colors">{parishionerName}</p>
                                                    <p className="text-sm text-muted-foreground line-clamp-1 italic max-w-md">
                                                        {conv.lastMessage || 'Inquiry started'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-3">
                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-black uppercase tracking-widest bg-muted/50 px-2 py-1 rounded">
                                                    <Clock className="h-3 w-3" />
                                                    {conv.updatedAt ? formatDistanceToNow(conv.updatedAt.toDate(), { addSuffix: true }) : 'Syncing...'}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[9px] uppercase font-black border-primary/30 text-primary bg-primary/5">Bridge Online</Badge>
                                                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
