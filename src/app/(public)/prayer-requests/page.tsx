'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Heart, User, Send, Loader2, Info, Clock, CheckCircle2, XCircle, LogIn } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { PrayerRequest } from '@/lib/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const prayerSchema = z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    request: z.string().min(10, 'Prayer request must be at least 10 characters.'),
    category: z.string().min(2, 'Please enter a category'),
    anonymous: z.boolean().default(false),
});

export default function PrayerRequestsPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useAuth();
    const [isSubmitting, setIsSaving] = useState(false);

    // Fetch all prayers and filter in code to support legacy data without userId
    const prayerQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'prayer_requests'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore]);

    const { data: prayers, isLoading } = useCollection<PrayerRequest>(prayerQuery);

    const myPrayers = prayers?.filter(p => 
      p.userId === user?.uid || 
      (p as any).email === user?.email
    );

    const form = useForm<z.infer<typeof prayerSchema>>({
        resolver: zodResolver(prayerSchema),
        defaultValues: {
            name: '',
            phone: '',
            request: '',
            category: '',
            anonymous: false,
        }
    });

    const onSubmit = async (values: z.infer<typeof prayerSchema>) => {
        if (!firestore) return;
        setIsSaving(true);

        try {
            await addDoc(collection(firestore, 'prayer_requests'), {
                name: values.anonymous ? 'Anonymous' : (values.name || 'Member'),
                phone: values.anonymous ? null : (values.phone || null),
                request: values.request || '',
                category: values.category || 'General',
                anonymous: values.anonymous || false,
                userId: user?.uid || null,
                email: user?.email || null, // Storing email for legacy matching fallback
                status: 'pending',
                createdAt: serverTimestamp(),
                prayerCount: 0,
            });

            toast({ title: 'Request Submitted', description: 'Your prayer intention has been sent for approval.' });
            form.reset();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-transparent pb-20">
            <PageHeader 
                title="Prayer Petitions" 
                subtitle="Cast all your anxieties on Him, because He cares for you. (1 Peter 5:7)" 
            />

            <section className="py-10">
                <div className="container max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12">
                    {/* Form Section */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden isolate">
                            <CardHeader className="bg-primary/5 border-b">
                                <CardTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                                    <Heart className="h-6 w-6 text-primary" />
                                    Post Intention
                                </CardTitle>
                                <CardDescription>Share your spiritual needs with the parish office.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        {!form.watch('anonymous') && (
                                            <>
                                                <FormField control={form.control} name="name" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold">Your Name</FormLabel>
                                                        <FormControl><Input placeholder="E.g., John Doe" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="phone" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold">Phone Number</FormLabel>
                                                        <FormControl><Input placeholder="e.g. 0712 345 678" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </>
                                        )}

                                        <FormField control={form.control} name="category" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">Prayer Category</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Health, Marriage, Business, Studies..." {...field} />
                                                </FormControl>
                                                <FormDescription className="text-[10px]">Type your own category</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="request" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">Your Prayer Request</FormLabel>
                                                <FormControl><Textarea placeholder="How can we pray for you?" rows={5} {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="anonymous" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border p-4 bg-muted/20">
                                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel className="font-bold">Submit Anonymously</FormLabel>
                                                </div>
                                            </FormItem>
                                        )} />

                                        <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-full font-black uppercase tracking-widest shadow-xl">
                                            {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                            Send Request
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Personal History Section */}
                    <div className="space-y-8">
                        <div className="flex items-center justify-between border-b pb-4">
                            <h2 className="text-3xl font-black uppercase tracking-tighter">My Prayer Requests</h2>
                            {user && <Badge variant="outline" className="font-bold">{myPrayers?.length || 0} Petitions</Badge>}
                        </div>

                        {!user ? (
                            <div className="text-center py-20 bg-muted/5 rounded-[3rem] border-2 border-dashed flex flex-col items-center gap-4">
                                <Info className="h-12 w-12 text-muted-foreground opacity-20" />
                                <p className="text-muted-foreground font-medium max-w-xs mx-auto">Sign in to view your prayer history and track approval status.</p>
                                <Button asChild variant="outline" className="rounded-full">
                                    <Link href="/login"><LogIn className="mr-2 h-4 w-4" /> Login Now</Link>
                                </Button>
                            </div>
                        ) : isLoading ? (
                            <div className="space-y-4">
                                {[1, 2].map(i => <Card key={i} className="h-40 animate-pulse bg-muted/20 rounded-3xl" />)}
                            </div>
                        ) : myPrayers?.length === 0 ? (
                            <div className="text-center py-20 bg-muted/5 rounded-[3rem] border-2 border-dashed">
                                <Info className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                                <p className="text-muted-foreground font-medium">You haven't submitted any prayer requests yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {myPrayers?.map((prayer) => (
                                    <Card key={prayer.id} className="border-none shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all">
                                        <CardHeader className="bg-primary/5 pb-2">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest">
                                                        {prayer.category}
                                                    </Badge>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                        {prayer.createdAt ? formatDistanceToNow(prayer.createdAt.toDate(), { addSuffix: true }) : 'recent'}
                                                    </span>
                                                </div>
                                                <Badge 
                                                    className={cn(
                                                        "font-black text-[9px] uppercase px-3 py-1",
                                                        prayer.status === 'approved' ? "bg-green-600 text-white" :
                                                        prayer.status === 'rejected' ? "bg-red-600 text-white" :
                                                        "bg-amber-500 text-white"
                                                    )}
                                                >
                                                    {prayer.status === 'approved' && <CheckCircle2 className="h-2 w-2 mr-1 inline" />}
                                                    {prayer.status === 'rejected' && <XCircle className="h-2 w-2 mr-1 inline" />}
                                                    {prayer.status === 'pending' && <Clock className="h-2 w-2 mr-1 inline" />}
                                                    {prayer.status}
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-xl font-bold mt-4 line-clamp-1">
                                                {prayer.anonymous ? 'Anonymous' : (prayer.name || 'Member')}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-4 p-8">
                                            <p className="text-lg text-foreground/80 leading-relaxed italic border-l-4 border-primary/20 pl-6">
                                                "{prayer.request}"
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
