'use client';

import { useState } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import type { BulletinPost } from '@/lib/types';
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
import { useCollection, useFirestore, useMemoFirebase, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, deleteDoc, doc, orderBy, query, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { BulletinPostForm } from '@/components/admin/BulletinPostForm';

export default function AdminBulletinPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'bulletins'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: posts, isLoading } = useCollection<BulletinPost>(postsQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BulletinPost | null>(null);
  const { toast } = useToast();

  const handleAddClick = () => {
    setSelectedPost(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (post: BulletinPost) => {
    setSelectedPost(post);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    const postDoc = doc(firestore, 'bulletins', id);
    deleteDoc(postDoc)
      .then(() => {
        toast({
          title: 'Post Deleted',
          description: 'The bulletin post has been successfully removed.',
        });
      })
      .catch((error: any) => {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: error.message || 'Could not delete the post.',
        });
        const permissionError = new FirestorePermissionError({
          path: postDoc.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedPost(null);
  };

  const handleFormSave = (postData: Partial<BulletinPost>) => {
    if (!firestore || !user) return;

    // INSTANT FEEDBACK: Close form and show success immediately
    setIsFormOpen(false);
    toast({
        title: 'Saved Successfully',
        description: 'Changes are now being synchronized with the registry.',
    });

    if (!postData.id) {
      const { id, ...dataToAdd } = postData;
      const newPost = {
        ...dataToAdd,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        reactions: {},
      };
      const bulletinCollection = collection(firestore, 'bulletins');
      addDoc(bulletinCollection, newPost)
        .catch((error: any) => {
            const permissionError = new FirestorePermissionError({
                path: bulletinCollection.path,
                operation: 'create',
                requestResourceData: newPost,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    } else {
      const { id, ...dataToUpdate } = postData;
      if (!id) return;
      const postDoc = doc(firestore, 'bulletins', id);
      const updateData = {
        ...dataToUpdate,
        updatedAt: serverTimestamp(),
      };
      updateDoc(postDoc, updateData)
        .catch((error: any) => {
            const permissionError = new FirestorePermissionError({
                path: postDoc.path,
                operation: 'update',
                requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Bulletin Posts</h1>
          <p className="text-muted-foreground">
            Create, edit, and manage posts for the community bulletin.
          </p>
        </div>
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Post
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Posts ({posts?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="hidden md:table-cell">Author</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center">Loading posts...</TableCell></TableRow>
              ) : (
                (posts || []).map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell className="hidden sm:table-cell"><Badge variant="outline">{post.category}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell">{post.authorName}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(post.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditClick(post)}
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
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the post "{post.title}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(post.id)}>
                                Delete
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
        <BulletinPostForm
          post={selectedPost}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
