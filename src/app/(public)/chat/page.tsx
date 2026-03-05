
'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, getDocs, where, limit } from 'firebase/firestore';
import type { ChatMessage, Conversation, RegisteredUser } from '@/lib/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Shield, Lock, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { AuthorBadge } from '@/components/shared/AuthorBadge';

export default function PrivateChatPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);

    // Fetch Super Admin profile for header branding
    const adminRef = useMemoFirebase(() => firestore ? doc(firestore, 'users', 'BKSmmIdohYQHlao5V9eZ9JQyaEV2') : null, [firestore]);
    const { data: adminUser } = useDoc<RegisteredUser>(adminRef);

    // Sync Bridge: Find or create conversation in 'private_chats'
    useEffect(() => {
        if (!user || !firestore) return;

        const findOrCreateConversation = async () => {
            try {
                const chatsRef = collection(firestore, 'private_chats');
                // Use a standard query that matches the security rules
                const q = query(chatsRef, where('participants', 'array-contains', user.uid), limit(1));
                const snap = await getDocs(q);
                
                let existingId = null;
                snap.forEach(doc => {
                    const data = doc.data() as Conversation;
                    if (data.participants.includes('parish_office')) {
                        existingId = doc.id;
                    }
                });

                if (existingId) {
                    setConversationId(existingId);
                } else {
                    const newChatRef = doc(collection(firestore, 'private_chats'));
                    await setDoc(newChatRef, {
                        id: newChatRef.id,
                        participants: [user.uid, 'parish_office'],
                        participantNames: { 
                            [user.uid]: user.displayName || user.email?.split('@')[0] || 'Member', 
                            'parish_office': 'St. Martin Office' 
                        },
                        updatedAt: serverTimestamp(),
                        lastMessage: 'Conversation started'
                    });
                    setConversationId(newChatRef.id);
                }
            } catch (err: any) {
                console.error("Chat Initialize Error (Check Security Rules):", err);
            }
        };

        findOrCreateConversation();
    }, [user, firestore]);

    // Real-time message listener
    useEffect(() => {
        if (!conversationId || !firestore) return;

        const messagesRef = collection(firestore, 'private_chats', conversationId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (snap) => {
            const msgs: ChatMessage[] = [];
            snap.forEach(doc => msgs.push({ id: doc.id, ...doc.data() } as ChatMessage));
            setMessages(msgs);
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
        }, (error) => {
            console.error("Public Chat Listener Error:", error);
        });

        return () => unsubscribe();
    }, [conversationId, firestore]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !user || !conversationId || !firestore) return;

        setIsSending(true);
        const text = inputText;
        setInputText('');

        try {
            const messagesRef = collection(firestore, 'private_chats', conversationId, 'messages');
            await addDoc(messagesRef, {
                senderId: user.uid,
                text: text,
                createdAt: serverTimestamp()
            });

            await setDoc(doc(firestore, 'private_chats', conversationId), {
                lastMessage: text,
                updatedAt: serverTimestamp()
            }, { merge: true });

        } catch (error: any) {
            console.error("Public Message Send Error:", error);
            toast({ variant: 'destructive', title: "Send Failed", description: error.message });
        } finally {
            setIsSending(false);
        }
    };

    if (isUserLoading) return <div className="h-screen flex flex-col items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-xs font-black tracking-widest uppercase mt-4 opacity-50">Syncing Bridge...</p></div>;
    
    if (!user) {
        return (
            <div className="bg-muted/30 min-h-screen">
                <PageHeader title="Private Support" subtitle="Secure messaging with the Parish Office." />
                <div className="container max-w-md mx-auto py-20 text-center px-4">
                    <Card className="p-10 rounded-3xl shadow-2xl space-y-6 border-none">
                        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                            <Lock className="h-10 w-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Login Required</h2>
                        <p className="text-muted-foreground leading-relaxed">Please sign in to access the private support channel and message the parish office.</p>
                        <Button asChild className="w-full h-12 rounded-full font-bold shadow-lg" size="lg">
                            <Link href="/login">Go to Login</Link>
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-muted/30 min-h-screen pb-10">
            <PageHeader title="Private Support" subtitle="Secure, real-time messaging with the Parish Office." />
            <div className="container max-w-3xl mx-auto px-4">
                <Card className="shadow-2xl border-none overflow-hidden h-[650px] flex flex-col bg-white rounded-3xl">
                    <div className="flex items-center justify-between p-5 border-b bg-card shadow-sm z-10">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <Shield className="h-7 w-7" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg leading-none uppercase tracking-tight flex items-center gap-2">
                                    St. Martin Office
                                    {adminUser && <AuthorBadge userId={adminUser.id} className="scale-90" />}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black flex items-center gap-1.5">
                                        <ShieldCheck className="h-3 w-3 text-primary" />
                                        Secure Official Channel
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 p-6 bg-[#e5ddd5] dark:bg-slate-950">
                        <div className="space-y-4">
                            <div className="flex justify-center mb-6">
                                <div className="bg-white/80 p-2 rounded-lg text-center shadow-sm max-w-xs border border-white/50">
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                        Messages are secured with official encryption
                                    </p>
                                </div>
                            </div>
                            
                            {messages.map((msg) => {
                                const isMe = msg.senderId === user.uid;
                                return (
                                    <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                        <div className={cn(
                                            "max-w-[85%] rounded-2xl p-4 shadow-md relative transition-all hover:scale-[1.01]",
                                            isMe ? "bg-[#dcf8c6] text-slate-900 rounded-tr-none border-b-2 border-[#c7e9b4]" : "bg-white text-slate-900 rounded-tl-none border-b-2 border-slate-200"
                                        )}>
                                            <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                                            <p className={cn(
                                                "text-[9px] mt-2 font-black opacity-60 text-right uppercase tracking-tighter",
                                                isMe ? "text-green-800" : "text-slate-500"
                                            )}>
                                                {msg.createdAt ? format(msg.createdAt.toDate(), 'h:mm a') : '...'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    <div className="p-5 border-t bg-card shadow-inner">
                        <form onSubmit={handleSend} className="flex gap-3">
                            <Input 
                                placeholder="Type your message here..." 
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                className="flex-1 rounded-full h-12 px-6 border-2 focus-visible:ring-primary text-base"
                            />
                            <Button type="submit" size="icon" className="rounded-full h-12 w-12 shadow-lg hover:scale-105 transition-transform" disabled={isSending || !inputText.trim()}>
                                {isSending ? <Loader2 className="animate-spin" /> : <Send className="h-5 w-5" />}
                            </Button>
                        </form>
                    </div>
                </Card>
            </div>
        </div>
    );
}
