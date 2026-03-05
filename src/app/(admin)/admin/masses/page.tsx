
'use client';

import { useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { Mass } from '@/lib/types';
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
import { useToast } from '@/hooks/use-toast';
import { MassForm } from '@/components/admin/MassForm';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, deleteDoc, doc, orderBy, query, addDoc } from 'firebase/firestore';

export default function AdminMassesPage() {
  const firestore = useFirestore();
  const massesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Note: Firestore can't order by day name string correctly. We'll sort client-side.
    return query(collection(firestore, 'masses'), orderBy('startTime'));
  }, [firestore]);

  const { data: masses, isLoading } = useCollection<Mass>(massesQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  
  const orderedDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const sortedMasses = masses?.sort((a, b) => {
    const dayDiff = orderedDays.indexOf(a.day) - orderedDays.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  const handleDelete = (id: string) => {
    if (!firestore) return;
    const massDoc = doc(firestore, 'masses', id);
    deleteDoc(massDoc)
      .then(() => {
        toast({
          title: 'Mass Deleted',
          description: 'The mass schedule has been successfully removed.',
        });
      })
      .catch((error: any) => {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: error.message || 'Could not delete the mass.',
        });
        const permissionError = new FirestorePermissionError({
          path: massDoc.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
  };

  const handleFormSave = (massData: Omit<Mass, 'id'>) => {
    if (!firestore) return;

    const massesCollection = collection(firestore, 'masses');
    addDoc(massesCollection, massData)
        .then(() => {
            setIsFormOpen(false);
            toast({
                title: 'Success!',
                description: 'Mass schedule has been added.',
            });
        })
        .catch((error: any) => {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: error.message || 'Could not save the mass schedule.',
            });
            const permissionError = new FirestorePermissionError({
                path: massesCollection.path,
                operation: 'create',
                requestResourceData: massData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Mass Schedule</h1>
          <p className="text-muted-foreground">
            Add or remove weekly mass times.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Mass Time
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Schedule ({sortedMasses?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center">Loading schedule...</TableCell></TableRow>
              ) : (
                (sortedMasses || []).map((mass) => (
                  <TableRow key={mass.id}>
                    <TableCell className="font-medium">{mass.day}</TableCell>
                    <TableCell>{mass.title}</TableCell>
                    <TableCell>{formatTime(mass.startTime)} - {formatTime(mass.endTime)}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the mass: "{mass.title} on {mass.day}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(mass.id)}>
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isFormOpen && (
        <MassForm
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
