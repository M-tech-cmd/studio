'use client';

import { useState } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import type { Event } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { EventForm } from '@/components/admin/EventForm';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, deleteDoc, doc, orderBy, query } from 'firebase/firestore';

export default function AdminEventsPage() {
  const firestore = useFirestore();
  const eventsQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'events'), orderBy('date', 'desc'));
  }, [firestore]);
  
  const { data: events, isLoading } = useCollection<Event>(eventsQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { toast } = useToast();

  const handleAddClick = () => {
    setSelectedEvent(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (event: Event) => {
    setSelectedEvent(event);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    const eventDoc = doc(firestore, 'events', id);
    
    try {
      await deleteDoc(eventDoc);
      toast({ title: 'Deleted', description: 'Event has been removed.' });
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: eventDoc.path,
        operation: 'delete',
      }));
    }
  };

  const getDateString = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Events</h1>
          <p className="text-muted-foreground">
            Create, edit, and manage parish events and announcements.
          </p>
        </div>
        <Button onClick={handleAddClick} className="rounded-full shadow-lg">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>

      <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle>All Scheduled Events ({events?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 animate-pulse">Syncing calendar...</TableCell>
                </TableRow>
              ) : (
                (events || []).map((event) => (
                    <TableRow key={event.id} className="hover:bg-primary/5 transition-colors">
                    <TableCell className="font-bold text-primary">{event.title}</TableCell>
                    <TableCell className="hidden md:table-cell font-medium">
                        {getDateString(event.date)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="text-[10px] uppercase font-black">{event.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                        {event.featured ? <Badge className="bg-amber-500 text-[9px] uppercase font-black">Yes</Badge> : 'No'}
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full h-8 w-8"
                            onClick={() => handleEditClick(event)}
                        >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="rounded-full h-8 w-8"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                            </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">Remove Event?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This will permanently delete <strong>"{event.title}"</strong>. This action is final.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-full">Abort</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(event.id)} className="bg-destructive text-white rounded-full">Execute Delete</AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        </div>
                    </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isFormOpen && (
        <EventForm
          event={selectedEvent}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
