'use client';

import { useState } from 'react';
import { PlusCircle, Edit, Trash2, Users, Phone } from 'lucide-react';
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
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

/**
 * Isolated Community Client Component.
 * Extracted to allow for dynamic chunk loading and resolve hydration/Webpack errors.
 */
export function CommunityClient() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const groupsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'community_groups'), orderBy('name'));
  }, [firestore]);

  const { data: groups, isLoading } = useCollection<CommunityGroup>(groupsQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<CommunityGroup | null>(null);

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
    
    // INSTANT UI FEEDBACK
    toast({ title: 'Removing Entity...', description: 'Syncing with registry.' });

    deleteDoc(groupDoc)
        .catch(() => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: groupDoc.path,
                operation: 'delete',
            }));
        });
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
        <Button onClick={handleAddClick} className="rounded-full shadow-lg">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Group
        </Button>
      </div>

      <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle>All Groups ({groups?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="hidden sm:table-cell">Leader</TableHead>
                <TableHead className="hidden lg:table-cell">Contact Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 animate-pulse opacity-50">Loading registry...</TableCell>
                </TableRow>
              ) : (
                (groups || []).map((group) => (
                    <TableRow key={group.id} className="hover:bg-primary/5 transition-colors">
                        <TableCell className="font-bold text-primary flex items-center gap-3">
                            <Avatar className="hidden sm:inline-flex border-2 border-white shadow-sm h-8 w-8">
                                <AvatarImage src={group.imageUrl} alt={group.name} />
                                <AvatarFallback className="bg-primary/10 text-primary"><Users className="h-4 w-4" /></AvatarFallback>
                            </Avatar>
                            {group.name}
                        </TableCell>
                    <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-[10px] font-black uppercase">{group.type}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm font-medium">{group.leader}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm font-medium">
                        <a href={`tel:${group.contactPhone}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                            <Phone className="h-3 w-3" />
                            {group.contactPhone}
                        </a>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full h-8 w-8"
                            onClick={() => handleEditClick(group)}
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
                                <AlertDialogTitle className="text-2xl font-black">Registry Termination</AlertDialogTitle>
                                <AlertDialogDescription>
                                This will permanently delete the group <strong>"{group.name}"</strong>. This action is final.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-full">Abort</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(group.id)} className="bg-destructive text-white rounded-full">Confirm Delete</AlertDialogAction>
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
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}