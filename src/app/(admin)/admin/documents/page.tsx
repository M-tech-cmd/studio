'use client';

import { useState, useEffect } from 'react';
import { 
    PlusCircle, 
    FileText, 
    Download, 
    Trash2, 
    Pencil, 
    Loader2, 
    Search,
    FileUp
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore } from '@/firebase';
import { collection, deleteDoc, doc, orderBy, query, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Badge } from '@/components/ui/badge';

const docSchema = z.object({
  title: z.string().min(2, "Title is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  // file is optional during EDIT because we might keep the old one
  file: z.any().optional(), 
});

export function DocumentsClient() {
  const firestore = useFirestore();
  const storage = getStorage();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const docsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'documents'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: documents, isLoading } = useCollection<any>(docsQuery);

  const form = useForm<z.infer<typeof docSchema>>({
    resolver: zodResolver(docSchema),
    defaultValues: {
      title: '',
      category: 'Announcement',
      description: '',
    },
  });

  // --- CRITICAL FIX: PRE-POPULATE FORM ON EDIT ---
  useEffect(() => {
    if (selectedDoc) {
      form.reset({
        title: selectedDoc.title,
        category: selectedDoc.category,
        description: selectedDoc.description || '',
      });
    } else {
      form.reset({
        title: '',
        category: 'Announcement',
        description: '',
      });
    }
  }, [selectedDoc, form]);

  const onSubmit = async (values: z.infer<typeof docSchema>) => {
    if (!firestore) return;
    setIsSaving(true);

    try {
      let fileUrl = selectedDoc?.fileUrl || ''; // Default to old URL if editing

      // If a new file is selected in the input
      if (values.file && values.file[0]) {
        const file = values.file[0];
        const storageRef = ref(storage, `documents/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(snapshot.ref);
      }

      if (!fileUrl && !selectedDoc) {
        throw new Error("Please select a file to upload.");
      }

      const dataToSave = {
        title: values.title,
        category: values.category,
        description: values.description || '',
        fileUrl: fileUrl, // Preserves old URL if no new file uploaded
        updatedAt: serverTimestamp(),
      };

      if (selectedDoc) {
        await updateDoc(doc(firestore, 'documents', selectedDoc.id), dataToSave);
        toast({ title: "Document Updated" });
      } else {
        await addDoc(collection(firestore, 'documents'), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Document Uploaded" });
      }

      setIsDialogOpen(false);
      setSelectedDoc(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Upload Failed", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore || !confirm("Are you sure?")) return;
    try {
      await deleteDoc(doc(firestore, 'documents', id));
      toast({ title: "Document Deleted" });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Error", description: error.message });
    }
  };

  const filteredDocs = documents?.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">Document Registry</h1>
          <p className="text-muted-foreground font-medium">Manage parish bulletins, reports, and forms.</p>
        </div>
        <Button onClick={() => { setSelectedDoc(null); setIsDialogOpen(true); }} className="rounded-full h-12 px-6 font-bold">
          <PlusCircle className="mr-2 h-5 w-5" />
          Upload New Document
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search documents by title or category..." 
          className="pl-10 h-12 rounded-xl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-black uppercase text-[10px] p-6">Document Info</TableHead>
              <TableHead className="font-black uppercase text-[10px] p-6">Category</TableHead>
              <TableHead className="font-black uppercase text-[10px] p-6">Date Added</TableHead>
              <TableHead className="text-right font-black uppercase text-[10px] p-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-20 animate-pulse font-bold">Loading Files...</TableCell></TableRow>
            ) : filteredDocs?.map((doc) => (
              <TableRow key={doc.id} className="group hover:bg-muted/30">
                <TableCell className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <FileText size={24} />
                    </div>
                    <div>
                      <div className="font-bold text-lg">{doc.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{doc.description || 'No description'}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="p-6">
                  <Badge variant="secondary" className="font-black text-[10px] uppercase px-3 py-1">{doc.category}</Badge>
                </TableCell>
                <TableCell className="p-6 text-muted-foreground font-medium">
                  {doc.createdAt ? format(doc.createdAt.toDate(), 'MMM dd, yyyy') : 'Recently'}
                </TableCell>
                <TableCell className="p-6 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" className="rounded-full" onClick={() => window.open(doc.fileUrl, '_blank')}>
                      <Download size={18} />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full" onClick={() => { setSelectedDoc(doc); setIsDialogOpen(true); }}>
                      <Pencil size={18} />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full text-destructive" onClick={() => handleDelete(doc.id)}>
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
                {selectedDoc ? 'Edit Document' : 'New Document'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel className="text-xs font-black uppercase">Title</FormLabel><FormControl><Input placeholder="e.g. Easter Bulletin 2024" {...field} className="h-12" /></FormControl><FormMessage /></FormItem>
              )}/>
              
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel className="text-xs font-black uppercase">Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-12"><SelectValue /></SelectTrigger></FormControl><SelectContent>
                    <SelectItem value="Announcement">Announcement</SelectItem>
                    <SelectItem value="Bulletin">Bulletin</SelectItem>
                    <SelectItem value="Financial Report">Financial Report</SelectItem>
                    <SelectItem value="Form">Registration Form</SelectItem>
                  </SelectContent></Select></FormItem>
              )}/>

              <FormField control={form.control} name="file" render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                    <FormLabel className="text-xs font-black uppercase">Document File {selectedDoc && '(Optional)'}</FormLabel>
                    <FormControl>
                        <div className="flex flex-col gap-2">
                            <Input 
                                type="file" 
                                accept=".pdf,.doc,.docx,.jpg,.png" 
                                onChange={(e) => onChange(e.target.files)} 
                                className="h-12 pt-2"
                                {...field}
                            />
                            {selectedDoc && !form.watch('file') && (
                                <p className="text-[10px] text-emerald-600 font-bold uppercase">Current file is preserved. Upload new only to replace.</p>
                            )}
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )}/>

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel className="text-xs font-black uppercase">Notes</FormLabel><FormControl><Input placeholder="Internal notes..." {...field} className="h-12" /></FormControl></FormItem>
              )}/>

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isSaving} className="w-full h-14 rounded-full font-black uppercase tracking-widest">
                  {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileUp className="mr-2 h-5 w-5" />}
                  {selectedDoc ? 'Update Document' : 'Upload to Registry'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper to use useMemo inside the component
function useMemo<T>(factory: () => T, deps: any[]) {
    const [val, setVal] = useState<T>(factory);
    useEffect(() => setVal(factory()), deps);
    return val;
}