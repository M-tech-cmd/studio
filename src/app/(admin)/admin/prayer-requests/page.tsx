'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { PrayerRequest } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Check, X, Trash2, Heart, Phone, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogDescription
} from '@/components/ui/dialog';

export default function AdminPrayerRequestsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const prayersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'prayer_requests'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: prayers, isLoading } = useCollection<PrayerRequest>(prayersQuery);

    const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
        if (!firestore) return;
        try {
            await updateDoc(doc(firestore, 'prayer_requests', id), { status });
            toast({ title: 'Status Updated', description: `Request has been ${status}.` });
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!firestore || !confirm('Delete this request permanently?')) return;
        try {
            await deleteDoc(doc(firestore, 'prayer_requests', id));
            toast({ title: 'Deleted', description: 'Prayer request removed from registry.' });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase">Prayer Registry</h1>
                    <p className="text-muted-foreground">Moderate and manage community petitions.</p>
                </div>
            </div>

            <Card className="border-none shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-primary" />
                        Total Petitions ({prayers?.length || 0})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Sender</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="w-[30%]">Intention</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-20 animate-pulse">Syncing registry...</TableCell></TableRow>
                            ) : (
                                prayers?.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="text-xs font-bold text-muted-foreground">
                                            {p.createdAt ? format(p.createdAt.toDate(), 'MMM dd, p') : 'recent'}
                                        </TableCell>
                                        <TableCell className="font-bold">{p.name}</TableCell>
                                        <TableCell>
                                            {(p as any).phone ? (
                                                <a 
                                                    href={`tel:${(p as any).phone}`}
                                                    className="flex items-center gap-2 text-primary font-bold hover:underline"
                                                >
                                                    <Phone className="h-4 w-4" />
                                                    {(p as any).phone}
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground text-xs italic">
                                                    Not provided
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell><Badge variant="outline" className="text-[10px] uppercase font-black">{(p as any).category}</Badge></TableCell>
                                        <TableCell className="text-sm italic line-clamp-2">"{p.request}"</TableCell>
                                        <TableCell>
                                            <Badge variant={p.status === 'approved' ? 'default' : p.status === 'rejected' ? 'destructive' : 'secondary'} className="uppercase font-black text-[9px]">
                                                {p.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button size="icon" variant="outline" className="h-8 w-8 text-primary">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="rounded-3xl border-none shadow-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Prayer Details</DialogTitle>
                                                            <DialogDescription>From {p.name || 'Anonymous'}</DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-4">
                                                            <div className="bg-muted/20 p-6 rounded-2xl border-l-4 border-primary">
                                                                <p className="italic text-lg">"{p.request}"</p>
                                                            </div>
                                                            {(p as any).phone && (
                                                                <div className="flex justify-center pt-4">
                                                                    <a href={`tel:${(p as any).phone}`}>
                                                                        <Button 
                                                                            variant="outline" 
                                                                            className="gap-2 rounded-full font-bold border-2 border-primary text-primary hover:bg-primary hover:text-white"
                                                                        >
                                                                            <Phone className="h-4 w-4" />
                                                                            Call {p.name}
                                                                        </Button>
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                                {p.status !== 'approved' && (
                                                    <Button size="icon" variant="outline" className="h-8 w-8 text-green-600" onClick={() => handleUpdateStatus(p.id, 'approved')}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {p.status !== 'rejected' && (
                                                    <Button size="icon" variant="outline" className="h-8 w-8 text-red-600" onClick={() => handleUpdateStatus(p.id, 'rejected')}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
