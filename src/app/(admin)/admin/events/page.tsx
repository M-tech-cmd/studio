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
import { addDoc, collection, deleteDoc, doc, orderBy, query, updateDoc } from 'firebase/firestore';

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

  const handleDelete = (id: string) => {
    if (!firestore) return;
    const eventDoc = doc(firestore, 'events', id);
    deleteDoc(eventDoc)
        .then(() => {
            toast({
              title: 'Event Deleted',
              description: 'The event has been successfully removed.',
            });
        })
        .catch((error: any) => {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: error.message || 'Could not delete the event.',
            });
            const permissionError = new FirestorePermissionError({
                path: eventDoc.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedEvent(null);
  };

  const handleFormSave = (eventData: Omit<Event, 'id'> & { id?: string }) => {
    if (!firestore) return;
    const isNew = !eventData.id;

    // INSTANT FEEDBACK
    setIsFormOpen(false);
    toast({
        title: 'Event Updated',
        description: 'Changes have been synchronized with the calendar.',
    });

    if (isNew) {
        const { id, ...dataToAdd } = eventData;
        const eventsCollection = collection(firestore, 'events');
        addDoc(eventsCollection, dataToAdd)
            .catch((error: any) => {
                const permissionError = new FirestorePermissionError({
                  path: eventsCollection.path,
                  operation: 'create',
                  requestResourceData: dataToAdd,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    } else {
        const { id, ...dataToUpdate } = eventData;
        if (!id) return;
        const eventDoc = doc(firestore, 'events', id);
        updateDoc(eventDoc, dataToUpdate)
            .catch((error: any) => {
                const permissionError = new FirestorePermissionError({
                  path: eventDoc.path,
                  operation: 'update',
                  requestResourceData: dataToUpdate,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
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
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Events ({events?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Featured
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : (
                (events || []).map((event) => (
                    <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell className="hidden md:table-cell">
                        {getDateString(event.date)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{event.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                        {event.featured ? 'Yes' : 'No'}
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            size="icon"
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
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                            </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the event "{event.title}".
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(event.id)}>
                                Continue
                                </AlertDialogAction>
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
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
