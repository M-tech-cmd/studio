'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth } from '@/firebase';
import { collection, query, orderBy, doc, setDoc, deleteDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import type { VolunteerSlot, RegisteredUser } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, Loader2, CheckCircle2, UserCheck, LogIn } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

function VolunteerSlotCard({ slot }: { slot: VolunteerSlot }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Check if user is signed up for this specific slot
    const signupQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'volunteer_slots', slot.id, 'signups', user.uid);
    }, [firestore, slot.id, user]);
    
    const [isSignedUp, setIsSignedUp] = useState(false);
    const [currentSignups, setCurrentSignups] = useState(0);

    useState(() => {
        if (!firestore) return;
        const unsubscribe = onSnapshot(collection(firestore, 'volunteer_slots', slot.id, 'signups'), (snap) => {
            setCurrentSignups(snap.size);
            if (user) {
                setIsSignedUp(snap.docs.some(d => d.id === user.uid));
            }
        });
        return () => unsubscribe();
    });

    const handleSignUp = async () => {
        if (!user || !firestore) return;
        setIsProcessing(true);
        try {
            if (isSignedUp) {
                await deleteDoc(doc(firestore, 'volunteer_slots', slot.id, 'signups', user.uid));
                toast({ title: 'Withdrawn', description: 'You have been removed from this slot.' });
            } else {
                if (currentSignups >= slot.spotsAvailable) {
                    toast({ variant: 'destructive', title: 'Full', description: 'All spots for this slot are taken.' });
                    return;
                }
                await setDoc(doc(firestore, 'volunteer_slots', slot.id, 'signups', user.uid), {
                    userId: user.uid,
                    name: user.displayName || 'Member',
                    email: user.email,
                    timestamp: serverTimestamp()
                });
                toast({ title: 'Signed Up!', description: "Thank you for serving! We'll see you there." });
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const remainingSpots = Math.max(slot.spotsAvailable - currentSignups, 0);

    return (
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm hover:shadow-2xl transition-all h-full flex flex-col">
            <CardHeader className="bg-primary/5 pb-4">
                <div className="flex justify-between items-start mb-2">
                    <Badge className="bg-primary text-white uppercase text-[9px] font-black tracking-widest">{slot.category}</Badge>
                    {isSignedUp && <Badge className="bg-green-600 text-white font-black animate-in zoom-in"><CheckCircle2 className="h-3 w-3 mr-1" /> ENROLLED</Badge>}
                </div>
                <CardTitle className="text-2xl font-black uppercase tracking-tighter leading-tight">{slot.title}</CardTitle>
                <CardDescription className="font-medium">{slot.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 flex-grow">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        <Calendar className="h-4 w-4 text-primary" />
                        {slot.date ? format(slot.date instanceof Date ? slot.date : (slot.date as any).toDate(), 'MMM dd, yyyy') : ''}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        <Clock className="h-4 w-4 text-primary" />
                        {slot.time}
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <MapPin className="h-4 w-4 text-primary" />
                    {slot.location}
                </div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest pt-4 border-t border-dashed">
                    <Users className="h-4 w-4 text-primary" />
                    <span className={remainingSpots === 0 ? 'text-destructive' : 'text-primary'}>
                        {remainingSpots} / {slot.spotsAvailable} SPOTS REMAINING
                    </span>
                </div>
            </CardContent>
            <CardFooter className="p-6 pt-0 mt-auto">
                {!user ? (
                    <Button asChild className="w-full rounded-full font-bold h-12 shadow-lg">
                        <Link href="/login"><LogIn className="mr-2 h-4 w-4" /> Sign in to Volunteer</Link>
                    </Button>
                ) : (
                    <Button 
                        onClick={handleSignUp} 
                        disabled={isProcessing || (remainingSpots === 0 && !isSignedUp)}
                        variant={isSignedUp ? 'destructive' : 'default'}
                        className="w-full rounded-full font-black uppercase tracking-widest h-12 shadow-xl active:scale-95 transition-all"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" /> : isSignedUp ? 'Cancel Enrollment' : 'Claim a Spot'}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

export default function VolunteerPage() {
    const firestore = useFirestore();
    const slotsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'volunteer_slots'), orderBy('date', 'asc'));
    }, [firestore]);

    const { data: slots, isLoading } = useCollection<VolunteerSlot>(slotsQuery);

    return (
        <div className="bg-transparent pb-20">
            <PageHeader 
                title="Serve Together" 
                subtitle="Each of you should use whatever gift you have received to serve others. (1 Peter 4:10)" 
            />

            <section className="py-10">
                <div className="container max-w-7xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                        <div className="bg-primary/5 p-8 rounded-3xl border-2 border-primary/10 max-w-2xl">
                            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2 mb-2">
                                <UserCheck className="h-5 w-5 text-primary" />
                                Why Volunteer?
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Our parish thrives on the dedication of our members. Whether it's welcoming visitors at the gate or preparing for special liturgies, your time makes a difference.
                            </p>
                        </div>
                        <div className="text-center md:text-right">
                            <Badge variant="outline" className="h-10 px-6 rounded-full font-black text-xs uppercase tracking-widest border-2">
                                {slots?.length || 0} Open Roles
                            </Badge>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 w-full rounded-[2rem]" />)}
                        </div>
                    ) : slots?.length === 0 ? (
                        <div className="text-center py-24 bg-muted/5 rounded-[3rem] border-2 border-dashed">
                            <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-10 mb-4" />
                            <h3 className="text-2xl font-black uppercase text-muted-foreground">No Current Needs</h3>
                            <p className="text-muted-foreground font-medium mt-2">All roles are currently filled. Check back next week!</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {slots?.map((slot) => (
                                <VolunteerSlotCard key={slot.id} slot={slot} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
