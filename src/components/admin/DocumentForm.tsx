
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Timestamp, collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import type { Document } from '@/lib/types';
import { useStorage, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const documentSchema = z.object({
  title: z.string().min(1, 'Document Title is required.'),
  description: z.string().default(''),
  category: z.enum(['Bulletin', 'Newsletter', 'Form', 'Policy', 'Announcement', 'Other']),
  date: z.string().min(1, 'Date is required.'),
  public: z.boolean().default(true),
});

type DocumentFormProps = {
  document: Document | null;
  onSave: (data: Omit<Document, 'id'> & { id?: string }) => void;
  onClose: () => void;
};

const formatDateForInput = (date: any) => {
    if (!date) return '';
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return format(d, 'yyyy-MM-dd');
};

export function DocumentForm({ document: existingDoc, onSave, onClose }: DocumentFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  
  const storage = useStorage();
  const firestore = useFirestore();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof documentSchema>>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: existingDoc?.title || '',
      description: existingDoc?.description || '',
      category: existingDoc?.category || 'Bulletin',
      date: existingDoc ? formatDateForInput(existingDoc.date) : format(new Date(), 'yyyy-MM-dd'),
      public: existingDoc ? existingDoc.public : true,
    },
  });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleSubmit = async () => {
    const values = form.getValues();
    
    console.log('Submit clicked', { 
        title: values.title, 
        file: selectedFile, 
        category: values.category, 
        date: values.date 
    });

    // Manual Validation & Scroll
    const isTitleValid = !!values.title?.trim();
    const isFileValid = !!selectedFile || !!existingDoc?.url;

    if (!isTitleValid || !isFileValid) {
        if (!isTitleValid) form.setError('title', { message: 'Document Title is required' });
        if (!isFileValid) setFileError('Please select a file to upload');
        
        // Scroll modal to top to show errors
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
    }

    try {
      let finalUrl = existingDoc?.url || '';
      let finalFileType = existingDoc?.fileType || '';

      if (selectedFile && storage) {
        const storageRef = ref(storage, `documents/${Date.now()}_${selectedFile.name}`);
        const snapshot = await uploadBytes(storageRef, selectedFile);
        finalUrl = await getDownloadURL(snapshot.ref);
        finalFileType = selectedFile.name.split('.').pop()?.toUpperCase() || 'FILE';
      }

      const dataToSave = {
        title: values.title,
        description: values.description || '',
        category: values.category,
        url: finalUrl,
        fileType: finalFileType,
        date: new Timestamp(new Date(`${values.date}T00:00:00`).getTime() / 1000, 0),
        public: values.public,
        updatedAt: serverTimestamp(),
        createdAt: existingDoc?.id ? undefined : serverTimestamp(),
      };

      if (firestore) {
          if (existingDoc?.id) {
              await updateDoc(doc(firestore, 'documents', existingDoc.id), dataToSave);
          } else {
              await addDoc(collection(firestore, 'documents'), dataToSave);
          }
      }

      toast({ title: existingDoc ? 'Document updated' : 'Document created' });
      onClose();
    } catch (error: any) {
      console.error('Upload/Save error:', error.code, error.message);
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        <DialogHeader className="p-6 bg-primary/5 border-b shrink-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
            {existingDoc ? 'Edit Registry' : 'New Document'}
          </DialogTitle>
        </DialogHeader>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8">
            <Form {...form}>
              <form id="document-form" className="space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Document Title *</FormLabel>
                      <FormControl>
                        <Input 
                            placeholder="E.g., Weekly Bulletin" 
                            {...field} 
                            className="h-12 text-lg font-bold border-2 focus-visible:ring-primary" 
                        />
                      </FormControl>
                      <FormMessage className="text-destructive font-bold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {form.formState.errors.title?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="h-12 border-2"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {['Bulletin', 'Newsletter', 'Form', 'Policy', 'Announcement', 'Other'].map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Date *</FormLabel>
                        <FormControl><Input type="date" {...field} className="h-12 border-2" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Summary / Description</FormLabel>
                      <FormControl>
                        <Textarea 
                            placeholder="Brief overview of content" 
                            rows={3} 
                            {...field} 
                            className="border-2 focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 pt-4 border-t border-dashed">
                  <FormLabel className="font-black text-xs uppercase tracking-widest text-muted-foreground">Document File *</FormLabel>
                  
                  {!selectedFile && !existingDoc?.url && (
                    <div className="flex flex-col items-center justify-center w-full">
                        <Button asChild variant="outline" className="w-full h-24 border-dashed border-2 rounded-2xl hover:bg-muted/50 transition-colors">
                        <label className="cursor-pointer flex flex-col items-center justify-center gap-1">
                            <Upload className="h-6 w-6 text-primary mb-1" />
                            <span className="font-bold">Select Document</span>
                            <input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,image/*"
                            onChange={handleFileChange} 
                            />
                        </label>
                        </Button>
                        <p className="text-[10px] text-muted-foreground mt-2 font-medium">Supports PDF, Word, Excel, PowerPoint, images and more</p>
                    </div>
                  )}

                  {fileError && <p className="text-xs font-bold text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {fileError}</p>}

                  {selectedFile && (
                    <div className="relative rounded-2xl border-2 p-4 bg-muted/5 animate-in fade-in slide-in-from-top-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={removeFile}
                        className="absolute -top-2 -right-2 h-6 w-6 bg-black/60 text-white rounded-full hover:bg-black/80 z-10"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <div className="flex items-center gap-4">
                        {selectedFile.type.startsWith('image/') && previewUrl ? (
                          <div className="relative h-16 w-16 rounded-lg overflow-hidden border">
                            <Image src={previewUrl} alt="Preview" fill className="object-cover" unoptimized />
                          </div>
                        ) : (
                          <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <FileText className="h-8 w-8" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold truncate">{selectedFile.name}</p>
                          <p className="text-[10px] font-black uppercase tracking-tighter opacity-50">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!selectedFile && existingDoc?.url && (
                    <div className="rounded-2xl border-2 p-4 bg-primary/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileText className="h-6 w-6 text-primary" />
                            <div>
                                <span className="text-sm font-bold block">Current Attachment</span>
                                <span className="text-[10px] text-muted-foreground font-medium">Click "Change File" to replace</span>
                            </div>
                        </div>
                        <label className="cursor-pointer">
                            <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/30 text-primary hover:bg-primary/10 transition-colors">Change File</Badge>
                            <input 
                                type="file" 
                                className="hidden" 
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,image/*"
                                onChange={handleFileChange} 
                            />
                        </label>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="public"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-2xl border-2 p-6 bg-white shadow-sm">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-6 w-6" /></FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-bold">Public Registry</FormLabel>
                        <p className="text-xs text-muted-foreground italic">Visible to all website visitors once published.</p>
                      </div>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
        </div>

        <DialogFooter className="p-6 bg-muted/10 border-t shrink-0 gap-4">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-full h-12 px-8 font-bold border-2">
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            className="rounded-full h-12 px-12 font-black shadow-xl"
          >
            {existingDoc ? 'SAVE CHANGES' : 'CREATE DOCUMENT'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
