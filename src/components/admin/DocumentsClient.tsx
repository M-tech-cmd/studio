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

/**
 * Isolated Documents Client Component.
 * Supports dynamic chunk loading to resolve network starvation errors.
 */
export function DocumentsClient() {
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
    
    // INSTANT FEEDBACK
    toast({ title: 'Removing Document...', description: 'Registry sync initiated.' });

    deleteDoc(docRef)
        .catch(() => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: docRef.path,
                operation: 'delete',
            }));
        });
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedDocument(null);
  };

  const handleFormSave = (docData: Omit<Document, 'id'> & { id?: string }) => {
    if (!firestore) return;
    const isNew = !docData.id;

    // 1. INSTANT UI FEEDBACK (Non-Blocking)
    setIsFormOpen(false);
    toast({
        title: 'Registry Updated',
        description: 'Document changes are now being synchronized.',
    });

    // 2. SILENT BACKGROUND SYNC
    if (isNew) {
        const { id, ...dataToAdd } = docData;
        const docsCollection = collection(firestore, 'documents');
        addDoc(docsCollection, dataToAdd)
            .catch(() => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docsCollection.path,
                    operation: 'create',
                    requestResourceData: dataToAdd,
                }));
            });
    } else {
        const { id, ...dataToUpdate } = docData;
        if (!id) return;
        const docRef = doc(firestore, 'documents', id!);
        updateDoc(docRef, dataToUpdate)
            .catch(() => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'update',
                    requestResourceData: dataToUpdate,
                }));
            });
    }
  };

  const toggleVisibility = (docToUpdate: Document) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'documents', docToUpdate.id);
    const updatedData = { public: !docToUpdate.public };
    updateDoc(docRef, updatedData)
        .catch(() => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: updatedData,
            }));
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
            Official parish registry and digital archive.
          </p>
        </div>
        <Button onClick={handleAddClick} className="rounded-full shadow-lg">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Document
        </Button>
      </div>

      <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle>All Documents ({documents?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
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
                    <TableCell colSpan={6} className="text-center py-20 animate-pulse opacity-50">Synchronizing archive...</TableCell>
                </TableRow>
              ) : (
                (documents || []).map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-primary/5 transition-colors">
                    <TableCell>
                        <div className="font-bold text-primary">{doc.title}</div>
                        <div className="text-xs text-muted-foreground hidden sm:block truncate max-w-xs">{doc.description}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-[10px] font-black uppercase">{doc.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className="text-[10px] font-black uppercase">{doc.fileType}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs font-bold text-muted-foreground">
                        {getDateString(doc.date)}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center space-x-2">
                        <Switch
                            id={`visibility-switch-${doc.id}`}
                            checked={doc.public}
                            onCheckedChange={() => toggleVisibility(doc)}
                        />
                        <Label htmlFor={`visibility-switch-${doc.id}`} className="flex items-center gap-1.5 text-[10px] font-black uppercase opacity-60">
                            {doc.public ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            {doc.public ? 'Public' : 'Hidden'}
                        </Label>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                        <Button
                            asChild
                            variant="outline"
                            size="icon"
                            className="rounded-full h-8 w-8"
                        >
                            <Link href={doc.url} download>
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Download</span>
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full h-8 w-8"
                            onClick={() => handleEditClick(doc)}
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
                                <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">Registry Purge</AlertDialogTitle>
                                <AlertDialogDescription>
                                This will permanently delete <strong>"{doc.title}"</strong> from the registry. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(doc.id)} className="bg-destructive text-white rounded-full">Confirm Purge</AlertDialogAction>
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
