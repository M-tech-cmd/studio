'use client';

import { useState } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import type { CommunityGroup } from '@/lib/types';
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
import { CommunityGroupForm } from '@/components/admin/CommunityGroupForm';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, query, updateDoc, orderBy } from 'firebase/firestore';

export default function AdminCommunityPage() {
  const firestore = useFirestore();
  const groupsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'community_groups'), orderBy('name'));
  }, [firestore]);

  const { data: groups, isLoading } = useCollection<CommunityGroup>(groupsQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<CommunityGroup | null>(null);
  const { toast } = useToast();

  const handleAddClick = () => {
    setSelectedGroup(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (group: CommunityGroup) => {
    setSelectedGroup(group);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    const groupDoc = doc(firestore, 'community_groups', id);
    
    // INSTANT FEEDBACK
    toast({ title: 'Removing Entity...', description: 'Syncing with registry.' });

    deleteDoc(groupDoc)
        .catch(() => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: groupDoc.path,
                operation: 'delete',
            }));
        });
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedGroup(null);
  };

  const handleFormSave = (groupData: Omit<CommunityGroup, 'id'> & { id?: string }) => {
    if (!firestore) return;
    const isNew = !groupData.id;

    // 1. INSTANT UI FEEDBACK (Non-Blocking)
    setIsFormOpen(false);
    toast({
        title: isNew ? 'Community Added' : 'Profile Updated',
        description: 'Changes are now being synchronized with the registry.',
    });

    // 2. SILENT BACKGROUND SYNC
    if (isNew) {
        const dataToAdd = { ...groupData };
        delete dataToAdd.id;
        const groupsCollection = collection(firestore, 'community_groups');
        addDoc(groupsCollection, dataToAdd)
            .catch(() => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: groupsCollection.path,
                    operation: 'create',
                    requestResourceData: dataToAdd,
                }));
            });
    } else {
        const { id, ...dataToUpdate } = groupData;
        if (!id) return;
        const groupDoc = doc(firestore, 'community_groups', id!);
        updateDoc(groupDoc, dataToUpdate)
            .catch(() => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: groupDoc.path,
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
          <h1 className="text-3xl font-bold tracking-tight">Manage Community Groups</h1>
          <p className="text-muted-foreground">
            Manage Small Christian Communities, groups, and choirs.
          </p>
        </div>
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Group
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Groups ({groups?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="hidden sm:table-cell">Leader</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : (
                (groups || []).map((group) => (
                    <TableRow key={group.id}>
                        <TableCell className="font-medium flex items-center gap-3">
                            <Avatar className="hidden sm:inline-flex">
                                <AvatarImage src={group.imageUrl} alt={group.name} />
                                <AvatarFallback><Users /></AvatarFallback>
                            </Avatar>
                            {group.name}
                        </TableCell>
                    <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{group.type}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{group.leader}</TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditClick(group)}
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
                                This action cannot be undone. This will permanently delete the group "{group.name}".
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(group.id)}>
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
        <CommunityGroupForm
          group={selectedGroup}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
