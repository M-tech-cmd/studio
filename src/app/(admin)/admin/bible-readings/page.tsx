'use client';

import { useState } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import type { BibleReading } from '@/lib/types';
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
import { BibleReadingForm } from '@/components/admin/BibleReadingForm';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, deleteDoc, doc, orderBy, query, addDoc, updateDoc } from 'firebase/firestore';

export default function AdminBibleReadingsPage() {
  const firestore = useFirestore();
  const readingsQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'bible_readings'), orderBy('date', 'desc'));
  }, [firestore]);
  
  const { data: readings, isLoading } = useCollection<BibleReading>(readingsQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedReading, setSelectedReading] = useState<BibleReading | null>(null);
  const { toast } = useToast();

  const handleAddClick = () => {
    setSelectedReading(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (reading: BibleReading) => {
    setSelectedReading(reading);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    const readingDoc = doc(firestore, 'bible_readings', id);
    deleteDoc(readingDoc)
      .then(() => {
        toast({
          title: 'Reading Deleted',
          description: 'The bible reading has been successfully removed.',
        });
      })
      .catch((error: any) => {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: error.message || 'Could not delete the reading.',
        });
        const permissionError = new FirestorePermissionError({
          path: readingDoc.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedReading(null);
  };

  const handleFormSave = (readingData: Omit<BibleReading, 'id'> & { id?: string }) => {
    if (!firestore) return;

    const successCallback = () => {
        setIsFormOpen(false);
        toast({
            title: 'Success!',
            description: 'Content is now live for members.',
        });
    };

    if (!readingData.id) {
        const { id, ...dataToAdd } = readingData;
        const readingsCollection = collection(firestore, 'bible_readings');
        addDoc(readingsCollection, dataToAdd)
            .then(successCallback)
            .catch((error: any) => {
                toast({
                    variant: 'destructive',
                    title: 'Uh oh! Something went wrong.',
                    description: error.message || 'Could not save the reading.',
                });
                const permissionError = new FirestorePermissionError({
                    path: readingsCollection.path,
                    operation: 'create',
                    requestResourceData: dataToAdd,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    } else {
        const { id, ...dataToUpdate } = readingData;
        if (!id) return;
        const readingDoc = doc(firestore, 'bible_readings', id);
        updateDoc(readingDoc, dataToUpdate)
            .then(successCallback)
            .catch((error: any) => {
                toast({
                    variant: 'destructive',
                    title: 'Uh oh! Something went wrong.',
                    description: error.message || 'Could not update the reading.',
                });
                const permissionError = new FirestorePermissionError({
                    path: readingDoc.path,
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
          <h1 className="text-3xl font-bold tracking-tight">Manage Bible Readings</h1>
          <p className="text-muted-foreground">
            Create, edit, and publish daily bible readings.
          </p>
        </div>
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Reading
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Readings ({readings?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                    Synchronizing readings...
                  </TableCell>
                </TableRow>
              ) : (readings || []).map((reading) => (
                <TableRow key={reading.id}>
                  <TableCell className="font-medium">{reading.title}</TableCell>
                  <TableCell className="hidden sm:table-cell">{getDateString(reading.date)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditClick(reading)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
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
                              This action cannot be undone. This will permanently delete the reading for "{reading.title}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(reading.id)}>
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isFormOpen && (
        <BibleReadingForm
          reading={selectedReading}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
