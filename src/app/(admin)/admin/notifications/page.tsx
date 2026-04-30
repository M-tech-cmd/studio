'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bell, Send, Trash2, History, Info, Loader2, Megaphone } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import type { Announcement } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const announcementSchema = z.object({
    title: z.string().min(3, 'Title is required.'),
    message: z.string().min(10, 'Message is required.'),
    category: z.enum(['Alert', 'News', 'Service']),
    targetAudience: z.enum(['all', 'members']),
});

export default function AdminNotificationsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const announcementQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'announcements'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: announcements, isLoading } = useCollection<Announcement>(announcementQuery);

    const form = useForm<z.infer<typeof announcementSchema>>({
        resolver: zodResolver(announcementSchema),
        defaultValues: {
            title: '',
            message: '',
            category: 'News',
            targetAudience: 'all',
        }
    });

    const onSubmit = async (values: z.infer<typeof announcementSchema>) => {
        if (!firestore) return;
        setIsSaving(true);
        try {
            await addDoc(collection(firestore, 'announcements'), {
                ...values,
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Announcement Published', description: 'Your message is now live on the homepage.' });
            form.reset();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!firestore || !confirm('Withdraw this announcement?')) return;
        try {
            await deleteDoc(doc(firestore, 'announcements', id));
            toast({ title: 'Withdrawn' });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Announcements Hub</h1>
                    <p className="text-muted-foreground">Broadcast messages to the parish portal.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
                {/* Form Section */}
                <Card className="lg:col-span-1 border-none shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b">
                        <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-widest">
                            <Megaphone className="h-5 w-5 text-primary" />
                            Draft Message
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField control={form.control} name="title" render={({ field }) => (
                                    <FormItem><FormLabel className="font-bold">Subject Headline</FormLabel><FormControl><Input {...field} placeholder="E.g., Sunday Mass Postponed" /></FormControl><FormMessage /></FormItem>
                                )} />
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="category" render={({ field }) => (
                                        <FormItem><FormLabel className="font-bold">Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="News">News</SelectItem><SelectItem value="Alert">Urgent Alert</SelectItem><SelectItem value="Service">Liturgical Service</SelectItem></SelectContent></Select></FormItem>
                                    )} />
                                    <FormField control={form.control} name="targetAudience" render={({ field }) => (
                                        <FormItem><FormLabel className="font-bold">Audience</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="all">Everyone</SelectItem><SelectItem value="members">Members Only</SelectItem></SelectContent></Select></FormItem>
                                    )} />
                                </div>

                                <FormField control={form.control} name="message" render={({ field }) => (
                                    <FormItem><FormLabel className="font-bold">Full Message</FormLabel><FormControl><Textarea rows={5} {...field} placeholder="Details of the announcement..." /></FormControl><FormMessage /></FormItem>
                                )} />

                                <Button type="submit" disabled={isSaving} className="w-full h-14 rounded-full font-black uppercase tracking-widest shadow-xl">
                                    {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Broadcast Now
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* List Section */}
                <Card className="lg:col-span-2 border-none shadow-xl rounded-3xl overflow-hidden h-full flex flex-col">
                    <CardHeader className="bg-muted/30 border-b">
                        <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-widest">
                            <History className="h-5 w-5 text-primary" />
                            Broadcast History
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Headline</TableHead>
                                    <TableHead>Target</TableHead>
                                    <TableHead className="text-right">Manage</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-20 animate-pulse">Syncing broadcasts...</TableCell></TableRow>
                                ) : announcements?.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">No past announcements found.</TableCell></TableRow>
                                ) : (
                                    announcements?.map((a) => (
                                        <TableRow key={a.id} className="hover:bg-muted/10 transition-colors">
                                            <TableCell className="text-[10px] font-bold text-muted-foreground">
                                                {a.createdAt ? format(a.createdAt.toDate(), 'MMM dd, p') : 'recent'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge className={cn("text-[8px] font-black uppercase tracking-widest px-2 h-4", a.category === 'Alert' ? 'bg-red-500' : 'bg-primary/20 text-primary border-none')}>
                                                        {a.category}
                                                    </Badge>
                                                    <span className="font-bold text-sm">{a.title}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-1">{a.message}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[9px] uppercase">{a.targetAudience}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(a.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
