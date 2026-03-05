
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


export default function AdminProfilesPage() {
  const firestore = useFirestore();
  const profilesQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'profiles'), orderBy('name'));
  }, [firestore]);

  const { data: profiles, isLoading } = useCollection<Profile>(profilesQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const { toast } = useToast();

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
    deleteDoc(profileDoc)
        .then(() => {
            toast({
              title: 'Profile Deleted',
              description: 'The profile has been successfully removed.',
            });
        })
        .catch(() => {
            const permissionError = new FirestorePermissionError({
                path: profileDoc.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedProfile(null);
  };

  const handleFormSave = (profileData: Omit<Profile, 'id'> & { id?: string }) => {
    if (!firestore) return;
    const isNew = !profileData.id;

    const successCallback = () => {
        setIsFormOpen(false);
        toast({
            title: 'Success!',
            description: 'Content is now live for members.',
        });
    };

    if (isNew) {
        const dataToAdd = { ...profileData };
        delete dataToAdd.id;
        const profilesCollection = collection(firestore, 'profiles');
        addDoc(profilesCollection, dataToAdd)
            .then(successCallback)
            .catch(() => {
                const permissionError = new FirestorePermissionError({
                    path: profilesCollection.path,
                    operation: 'create',
                    requestResourceData: dataToAdd,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    } else {
        const { id, ...dataToUpdate } = profileData;
        if (!id) return;
        const profileDoc = doc(firestore, 'profiles', id);
        updateDoc(profileDoc, dataToUpdate)
            .then(successCallback)
            .catch(() => {
                const permissionError = new FirestorePermissionError({
                    path: profileDoc.path,
                    operation: 'update',
                    requestResourceData: dataToUpdate,
                });
                errorEmitter.emit('permission-error', permissionError);
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
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Profile
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Registry ({profiles?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
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
                    <TableCell colSpan={5} className="text-center">Loading registry...</TableCell>
                </TableRow>
              ) : (
                (profiles || []).map((profile) => (
                    <TableRow key={profile.id}>
                    <TableCell>
                        <Avatar>
                            <AvatarImage src={profile.imageUrl} alt={profile.name} />
                            <AvatarFallback><User /></AvatarFallback>
                        </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{profile.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{profile.role}</TableCell>
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
                            onClick={() => handleEditClick(profile)}
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
                                This will permanently remove "{profile.name}" from the official staff registry.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(profile.id)}>
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
        <ProfileForm
          profile={selectedProfile}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
