'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Heart, HandIcon, User, Send, Loader2, Info } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import type { PrayerRequest } from '@/lib/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

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
    const [isSubmitting, setIsSaving] = useState(false);

    const prayerQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'prayer_requests'),
            where('status', '==', 'approved'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore]);

    const { data: prayers, isLoading } = useCollection<PrayerRequest>(prayerQuery);

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

    const handlePray = async (id: string) => {
        if (!firestore) return;
        try {
            await updateDoc(doc(firestore, 'prayer_requests', id), {
                prayerCount: increment(1)
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="bg-transparent pb-20">
            <PageHeader 
                title="Prayer Petitions" 
                subtitle="Cast all your anxieties on Him, because He cares for you. (1 Peter 5:7)" 
            />

            <section className="py-10">
                <div className="container max-w-7xl mx-auto px-4 grid lg:grid-cols-3 gap-12">
                    {/* Form Section */}
                    <div className="lg:col-span-1">
                        <Card className="border-none shadow-2xl rounded-3xl sticky top-24 overflow-hidden isolate">
                            <CardHeader className="bg-primary/5 border-b">
                                <CardTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                                    <Heart className="h-6 w-6 text-primary" />
                                    Post Intention
                                </CardTitle>
                                <CardDescription>Share your spiritual needs with our community.</CardDescription>
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

                    {/* Feed Section */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center justify-between border-b pb-4">
                            <h2 className="text-3xl font-black uppercase tracking-tighter">Community Wall</h2>
                            <Badge variant="outline" className="font-bold">{prayers?.length || 0} Petitions</Badge>
                        </div>

                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <Card key={i} className="h-40 animate-pulse bg-muted/20 rounded-3xl" />)}
                            </div>
                        ) : prayers?.length === 0 ? (
                            <div className="text-center py-20 bg-muted/5 rounded-[3rem] border-2 border-dashed">
                                <Info className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                                <p className="text-muted-foreground font-medium">No public petitions yet. Be the first to share.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {prayers?.map((prayer) => (
                                    <Card key={prayer.id} className="border-none shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg">{prayer.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                                        {prayer.createdAt ? formatDistanceToNow(prayer.createdAt.toDate(), { addSuffix: true }) : 'recent'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest">
                                                {prayer.category}
                                            </Badge>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            <p className="text-lg text-foreground/80 leading-relaxed italic border-l-4 border-primary/20 pl-6">
                                                "{prayer.request}"
                                            </p>
                                        </CardContent>
                                        <CardFooter className="bg-muted/5 border-t flex items-center justify-between p-6">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Heart className="h-4 w-4 text-primary fill-primary/10" />
                                                <span className="font-black text-xs uppercase tracking-widest">{prayer.prayerCount || 0} prayed for this</span>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                className="rounded-full border-2 hover:bg-primary hover:text-white transition-all font-bold gap-2"
                                                onClick={() => handlePray(prayer.id)}
                                            >
                                                <HandIcon className="h-4 w-4" />
                                                🙏 I'll Pray
                                            </Button>
                                        </CardFooter>
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
