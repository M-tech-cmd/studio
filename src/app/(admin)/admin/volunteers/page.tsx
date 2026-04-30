'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { VolunteerSlot } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { PlusCircle, Trash2, Users, Eye, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

function VolunteerManager({ slot }: { slot: VolunteerSlot }) {
    const firestore = useFirestore();
    const [signups, setSignups] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const loadSignups = () => {
        if (!firestore) return;
        const colRef = collection(firestore, 'volunteer_slots', slot.id, 'signups');
        useCollection(query(colRef)).data?.then(setSignups);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Roster
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Volunteer Roster</DialogTitle>
                    <DialogDescription>{slot.title} - {format(slot.date instanceof Date ? slot.date : (slot.date as any).toDate(), 'MMM dd')}</DialogDescription>
                </DialogHeader>
                <SignupsList slotId={slot.id} />
            </DialogContent>
        </Dialog>
    );
}

function SignupsList({ slotId }: { slotId: string }) {
    const firestore = useFirestore();
    const signupQuery = useMemoFirebase(() => firestore ? collection(firestore, 'volunteer_slots', slotId, 'signups') : null, [firestore, slotId]);
    const { data: signups, isLoading } = useCollection(signupQuery);

    return (
        <div className="space-y-4 mt-4">
            {isLoading ? <div className="animate-pulse h-20 bg-muted rounded" /> : signups?.length === 0 ? <p className="text-center text-muted-foreground italic py-8">No signups yet.</p> : (
                <ScrollArea className="h-64">
                    {signups?.map((s) => (
                        <div key={s.id} className="flex items-center justify-between p-3 border rounded-xl mb-2">
                            <div>
                                <p className="font-bold">{s.name}</p>
                                <p className="text-xs text-muted-foreground">{s.email}</p>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{format(s.timestamp?.toDate(), 'MMM dd, p')}</span>
                        </div>
                    ))}
                </ScrollArea>
            )}
        </div>
    );
}

export default function AdminVolunteersPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const slotsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'volunteer_slots'), orderBy('date', 'desc'));
    }, [firestore]);

    const { data: slots, isLoading } = useCollection<VolunteerSlot>(slotsQuery);

    const handleCreate = async (e: any) => {
        e.preventDefault();
        if (!firestore) return;
        const formData = new FormData(e.target);
        const data = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            date: Timestamp.fromDate(new Date(formData.get('date') as string)),
            time: formData.get('time') as string,
            location: formData.get('location') as string,
            spotsAvailable: parseInt(formData.get('spots') as string),
            category: formData.get('category') as string,
            createdAt: serverTimestamp(),
        };

        try {
            await addDoc(collection(firestore, 'volunteer_slots'), data);
            toast({ title: 'Created', description: 'Volunteer opportunity posted.' });
            setIsDialogOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    const handleDelete = async (id: string) => {
        if (!firestore || !confirm('Delete this opportunity?')) return;
        try {
            await deleteDoc(doc(firestore, 'volunteer_slots', id));
            toast({ title: 'Deleted' });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase">Volunteer Portal</h1>
                    <p className="text-muted-foreground">Manage service roles and church activities.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-full shadow-lg font-bold">
                            <PlusCircle className="mr-2 h-4 w-4" /> Create Need
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader><DialogTitle>New Volunteer Opportunity</DialogTitle></DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Opportunity Title</Label>
                                    <Input name="title" required placeholder="E.g., Sunday Usher" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Input name="category" required placeholder="Liturgy, Choir, etc." />
                                </div>
                            </div>
                            <div className="space-y-2"><Label>Description</Label><Textarea name="description" required /></div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2"><Label>Date</Label><Input name="date" type="date" required /></div>
                                <div className="space-y-2"><Label>Time</Label><Input name="time" type="time" required /></div>
                                <div className="space-y-2"><Label>Spots</Label><Input name="spots" type="number" required defaultValue="5" /></div>
                            </div>
                            <div className="space-y-2"><Label>Location</Label><Input name="location" required defaultValue="Parish Compound" /></div>
                            <DialogFooter><Button type="submit" className="w-full">Publish Opportunity</Button></DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Active Postings ({slots?.length || 0})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date / Role</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Signups</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-20 animate-pulse">Loading opportunities...</TableCell></TableRow>
                            ) : (
                                slots?.map((s) => (
                                    <TableRow key={s.id}>
                                        <TableCell>
                                            <p className="font-black uppercase text-xs text-primary">{s.title}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground">{s.date ? format(s.date instanceof Date ? s.date : (s.date as any).toDate(), 'MMM dd, yyyy') : ''} • {s.time}</p>
                                        </TableCell>
                                        <TableCell><Badge variant="outline" className="text-[9px] font-black">{s.category}</Badge></TableCell>
                                        <TableCell className="text-sm font-medium">{s.location}</TableCell>
                                        <TableCell><Badge variant="secondary" className="font-bold">Total Spots: {s.spotsAvailable}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <VolunteerManager slot={s} />
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(s.id)}>
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
