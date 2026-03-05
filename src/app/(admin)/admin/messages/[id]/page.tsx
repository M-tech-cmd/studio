
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import type { ChatMessage, Conversation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, ArrowLeft, User, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AuthorBadge } from '@/components/shared/AuthorBadge';
import { useToast } from '@/hooks/use-toast';

/**
 * Admin Conversation Detail: High-fidelity real-time sync.
 * Uses onSnapshot to ensure messages appear without refreshing.
 */
export default function AdminConversationPage() {
    const params = useParams();
    const id = params?.id as string;
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const chatRef = useMemoFirebase(() => id ? doc(firestore, 'private_chats', id) : null, [firestore, id]);
    const { data: conversation, isLoading: chatLoading } = useDoc<Conversation>(chatRef);

    useEffect(() => {
        if (!id || !firestore) return;

        console.log(`Admin Bridge: Attaching real-time listener to thread ${id}`);
        const messagesRef = collection(firestore, 'private_chats', id, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (snap) => {
            const msgs: ChatMessage[] = [];
            snap.forEach(doc => msgs.push({ id: doc.id, ...doc.data() } as ChatMessage));
            setMessages(msgs);
            // Smooth scroll to the latest bubble
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
        }, (error) => {
            console.error("Bridge Message Sync Error:", error);
        });

        return () => unsubscribe();
    }, [id, firestore]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !user || !id || !firestore) return;

        setIsSending(true);
        const text = inputText;
        setInputText('');

        try {
            const messagesRef = collection(firestore, 'private_chats', id, 'messages');
            // Sending as official 'parish_office' identity for consistent branding
            await addDoc(messagesRef, {
                senderId: 'parish_office',
                text: text,
                createdAt: serverTimestamp()
            });

            // Update parent conversation meta for the inbox list
            await setDoc(doc(firestore, 'private_chats', id), {
                lastMessage: text,
                updatedAt: serverTimestamp()
            }, { merge: true });

        } catch (error: any) {
            console.error("Office Reply Failed:", error);
            toast({ variant: 'destructive', title: "Sync Blocked", description: error.message });
        } finally {
            setIsSending(false);
        }
    };

    if (chatLoading) return (
        <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Securing Bridge...</p>
        </div>
    );
    
    if (!conversation) return (
        <div className="p-20 text-center animate-in fade-in">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Support Thread Not Found</h2>
            <Button variant="link" onClick={() => router.push('/admin/messages')} className="mt-4 text-lg">Return to Inbox</Button>
        </div>
    );

    const parishionerId = conversation.participants.find(p => p !== 'parish_office');

    return (
        <div className="flex flex-col h-[calc(100vh-160px)] bg-muted/20 rounded-3xl overflow-hidden border-2 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card p-5 border-b flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/admin/messages')} className="rounded-full hover:bg-primary/10">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20 shadow-inner">
                            <User className="h-7 w-7" />
                        </div>
                        <div>
                            <h3 className="font-black text-xl uppercase tracking-tighter leading-none">
                                {parishionerId ? <AuthorBadge userId={parishionerId} fallbackName="Parish Member" /> : 'Member'}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <p className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase flex items-center gap-1.5">
                                    <ShieldCheck className="h-3 w-3 text-primary" />
                                    Secure Bridge Active
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 p-8 bg-[#e5ddd5] dark:bg-slate-950">
                <div className="space-y-6 max-w-4xl mx-auto pb-10">
                    <div className="flex justify-center mb-8">
                        <div className="bg-white/80 dark:bg-slate-900/80 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground border shadow-sm">
                            Official Church Communication Channel
                        </div>
                    </div>

                    {messages.map((msg) => {
                        const isMeAsOffice = msg.senderId === 'parish_office';
                        return (
                            <div key={msg.id} className={cn("flex flex-col", isMeAsOffice ? "items-end" : "items-start")}>
                                <div className={cn(
                                    "max-w-[75%] rounded-2xl p-5 shadow-lg relative transition-all hover:scale-[1.01]",
                                    isMeAsOffice 
                                        ? "bg-primary text-primary-foreground rounded-tr-none border-b-2 border-primary/20" 
                                        : "bg-white text-slate-900 rounded-tl-none border-b-2 border-slate-200"
                                )}>
                                    <p className="text-base font-medium leading-relaxed">{msg.text}</p>
                                    <p className={cn(
                                        "text-[10px] mt-3 font-black uppercase tracking-tighter opacity-60 text-right flex items-center justify-end gap-1.5",
                                        isMeAsOffice ? "text-white" : "text-muted-foreground"
                                    )}>
                                        {msg.createdAt ? format(msg.createdAt.toDate(), 'h:mm a') : 'Syncing...'}
                                        {isMeAsOffice && <ShieldCheck className="h-2.5 w-2.5" />}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <div className="p-6 bg-card border-t shadow-inner">
                <form onSubmit={handleSend} className="flex gap-4 max-w-4xl mx-auto">
                    <Input 
                        placeholder="Reply as Parish Office..." 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="flex-1 rounded-full h-14 px-8 border-2 focus-visible:ring-primary text-lg shadow-sm"
                        autoFocus
                    />
                    <Button type="submit" size="lg" className="rounded-full h-14 w-14 shadow-xl hover:scale-110 transition-transform active:scale-95" disabled={isSending || !inputText.trim()}>
                        {isSending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                    </Button>
                </form>
            </div>
        </div>
    );
}
