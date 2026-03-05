
'use client';

import { useState } from 'react';
import { PlusCircle, Edit, Trash2, Download, Eye, EyeOff } from 'lucide-react';
import type { Document } from '@/lib/types';
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
import { DocumentForm } from '@/components/admin/DocumentForm';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function AdminDocumentsPage() {
  const firestore = useFirestore();
  const documentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'documents'), orderBy('date', 'desc'));
  }, [firestore]);

  const { data: documents, isLoading } = useCollection<Document>(documentsQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const { toast } = useToast();

  const handleAddClick = () => {
    setSelectedDocument(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (doc: Document) => {
    setSelectedDocument(doc);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'documents', id);
    deleteDoc(docRef)
        .then(() => {
            toast({
              title: 'Document Deleted',
              description: 'The document has been successfully removed.',
            });
        })
        .catch(() => {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedDocument(null);
  };

  const handleFormSave = (docData: Omit<Document, 'id'> & { id?: string }) => {
    if (!firestore) return;
    const isNew = !docData.id;

    const successCallback = () => {
        setIsFormOpen(false);
        toast({
            title: 'Success!',
            description: 'Content is now live for members.',
        });
    };

    if (isNew) {
        const dataToAdd = { ...docData };
        delete dataToAdd.id;
        const docsCollection = collection(firestore, 'documents');
        addDoc(docsCollection, dataToAdd)
            .then(successCallback)
            .catch(() => {
                const permissionError = new FirestorePermissionError({
                    path: docsCollection.path,
                    operation: 'create',
                    requestResourceData: dataToAdd,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    } else {
        const { id, ...dataToUpdate } = docData;
        if (!id) return;
        const docRef = doc(firestore, 'documents', id);
        updateDoc(docRef, dataToUpdate)
            .then(successCallback)
            .catch(() => {
                const permissionError = new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'update',
                    requestResourceData: dataToUpdate,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    }
  };

  const toggleVisibility = (docToUpdate: Document) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'documents', docToUpdate.id);
    const updatedData = { public: !docToUpdate.public };
    updateDoc(docRef, updatedData)
        .catch(() => {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: updatedData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
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
          <h1 className="text-3xl font-bold tracking-tight">Manage Documents</h1>
          <p className="text-muted-foreground">
            Upload and manage parish documents.
          </p>
        </div>
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Document
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Documents ({documents?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden sm:table-cell">File Type</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : (
                (documents || []).map((doc) => (
                    <TableRow key={doc.id}>
                    <TableCell>
                        <div className="font-medium">{doc.title}</div>
                        <div className="text-sm text-muted-foreground hidden sm:block">{doc.description}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{doc.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">{doc.fileType}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                        {getDateString(doc.date)}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center space-x-2">
                        <Switch
                            id={`visibility-switch-${doc.id}`}
                            checked={doc.public}
                            onCheckedChange={() => toggleVisibility(doc)}
                        />
                        <Label htmlFor={`visibility-switch-${doc.id}`} className="flex items-center gap-1.5 text-xs">
                            {doc.public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            {doc.public ? 'Public' : 'Private'}
                        </Label>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                        <Button
                            asChild
                            variant="outline"
                            size="icon"
                        >
                            <Link href={doc.url} download>
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Download</span>
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditClick(doc)}
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
                                This action cannot be undone. This will permanently delete the document "{doc.title}".
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(doc.id)}>
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
        <DocumentForm
          document={selectedDocument}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
