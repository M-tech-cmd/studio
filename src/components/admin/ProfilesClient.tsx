'use client';

import { useState } from 'react';
import { PlusCircle, Edit, Trash2, User } from 'lucide-react';
import type { Profile } from '@/lib/types';
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
import { ProfileForm } from '@/components/admin/ProfileForm';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, query, updateDoc, orderBy } from 'firebase/firestore';

/**
 * Isolated Profiles Client Component.
 * Extracted to allow for high-priority dynamic chunk loading and resolve Webpack import errors.
 */
export function ProfilesClient() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const profilesQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'profiles'), orderBy('name'));
  }, [firestore]);

  const { data: profiles, isLoading } = useCollection<Profile>(profilesQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const handleAddClick = () => {
    setSelectedProfile(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (profile: Profile) => {
    setSelectedProfile(profile);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    const profileDoc = doc(firestore, 'profiles', id);
    
    // INSTANT UI FEEDBACK
    toast({ title: 'Removing Profile...', description: 'Registry update initiated.' });

    deleteDoc(profileDoc)
        .catch(() => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: profileDoc.path,
                operation: 'delete',
            }));
        });
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedProfile(null);
  };

  const handleFormSave = (profileData: Omit<Profile, 'id'> & { id?: string }) => {
    if (!firestore) return;
    const isNew = !profileData.id;

    // 1. INSTANT UI FEEDBACK (Non-Blocking)
    setIsFormOpen(false);
    toast({
        title: isNew ? 'Profile Created' : 'Identity Updated',
        description: 'Registry changes are now being synchronized.',
    });

    // 2. BACKGROUND DATA SYNC
    if (isNew) {
        const { id, ...dataToAdd } = profileData;
        const profilesCollection = collection(firestore, 'profiles');
        addDoc(profilesCollection, dataToAdd)
            .catch(() => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: profilesCollection.path,
                    operation: 'create',
                    requestResourceData: dataToAdd,
                }));
            });
    } else {
        const { id, ...dataToUpdate } = profileData;
        if (!id) return;
        const profileDoc = doc(firestore, 'profiles', id!);
        updateDoc(profileDoc, dataToUpdate)
            .catch(() => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: profileDoc.path,
                    operation: 'update',
                    requestResourceData: dataToUpdate,
                }));
            });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Staff & Clergy</h1>
          <p className="text-muted-foreground">
            Official parish leadership and staff records.
          </p>
        </div>
        <Button onClick={handleAddClick} className="rounded-full shadow-lg">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Profile
        </Button>
      </div>

      <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle>Staff Registry ({profiles?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead>Photo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 animate-pulse opacity-50">Synchronizing registry...</TableCell>
                </TableRow>
              ) : (
                (profiles || []).map((profile) => (
                    <TableRow key={profile.id} className="hover:bg-primary/5 transition-colors">
                    <TableCell>
                        <Avatar className="border-2 border-white shadow-sm">
                            <AvatarImage src={profile.imageUrl} alt={profile.name} />
                            <AvatarFallback className="bg-primary/5 text-primary"><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                    </TableCell>
                    <TableCell className="font-bold text-primary">{profile.name}</TableCell>
                    <TableCell className="hidden md:table-cell font-medium">{profile.role}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <Badge variant={profile.active === false ? 'destructive' : 'default'} className={profile.active === false ? '' : 'bg-green-600'}>
                        {profile.active === false ? 'Inactive' : 'Active'}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full h-8 w-8"
                            onClick={() => handleEditClick(profile)}
                        >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" className="rounded-full h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                            </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-2xl font-black">Account Termination</AlertDialogTitle>
                                <AlertDialogDescription>
                                This will permanently remove <strong>"{profile.name}"</strong> from the official staff registry. This action is irreversible.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-full">Abort</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(profile.id)} className="bg-destructive text-white rounded-full">Confirm Deletion</AlertDialogAction>
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
        <ProfileForm
          profile={selectedProfile}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
