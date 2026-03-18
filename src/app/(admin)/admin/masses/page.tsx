'use client';

import { useState } from 'react';
import { PlusCircle, Trash2, Edit } from 'lucide-react';
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
import { collection, deleteDoc, doc, orderBy, query, addDoc, updateDoc } from 'firebase/firestore';

export default function AdminMassesPage() {
  const firestore = useFirestore();
  const massesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Note: Firestore can't order by day name string correctly. We'll sort client-side.
    return query(collection(firestore, 'masses'), orderBy('startTime'));
  }, [firestore]);

  const { data: masses, isLoading } = useCollection<Mass>(massesQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMass, setSelectedMass] = useState<Mass | null>(null);
  const { toast } = useToast();
  
  const orderedDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const sortedMasses = masses?.sort((a, b) => {
    const dayDiff = orderedDays.indexOf(a.day) - orderedDays.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  const handleAddClick = () => {
    setSelectedMass(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (mass: Mass) => {
    setSelectedMass(mass);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    const massDoc = doc(firestore, 'masses', id);
    
    // OPTIMISTIC FEEDBACK
    toast({ title: 'Deleting Mass...', description: 'Registry is being updated.' });

    deleteDoc(massDoc)
      .catch((error: any) => {
        const permissionError = new FirestorePermissionError({
          path: massDoc.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedMass(null);
  };

  const handleFormSave = (massData: Omit<Mass, 'id'> & { id?: string }) => {
    if (!firestore) return;

    // 1. DATA VALIDATION: Prevent undefined field errors
    if (!massData.day || !massData.title || !massData.startTime || !massData.endTime) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Day, Title, and both Start/End times are required.',
        });
        return;
    }

    const isEdit = !!massData.id;
    
    // 2. GEMINI METHOD: Instant UI Update
    setIsFormOpen(false);
    toast({
        title: isEdit ? 'Schedule Updated' : 'Mass Added',
        description: 'Changes are being synchronized with the public schedule.',
    });

    // 3. PERSISTENCE: Strict removal of 'id' from document body
    const { id, ...cleanData } = massData;
    const sanitizedData = {
        day: cleanData.day,
        title: cleanData.title,
        startTime: cleanData.startTime,
        endTime: cleanData.endTime,
        description: cleanData.description || '', // Default to empty string
    };

    if (isEdit) {
        const massDoc = doc(firestore, 'masses', id!);
        updateDoc(massDoc, sanitizedData)
            .catch((error: any) => {
                const permissionError = new FirestorePermissionError({
                    path: massDoc.path,
                    operation: 'update',
                    requestResourceData: sanitizedData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    } else {
        const massesCollection = collection(firestore, 'masses');
        addDoc(massesCollection, sanitizedData)
            .catch((error: any) => {
                const permissionError = new FirestorePermissionError({
                    path: massesCollection.path,
                    operation: 'create',
                    requestResourceData: sanitizedData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    }
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
        <Button onClick={handleAddClick}>
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
                      <div className="flex justify-end gap-2">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleEditClick(mass)}
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
        <MassForm
          mass={selectedMass}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
