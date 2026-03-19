'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, FileText, X, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Timestamp, collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from "firebase/storage";

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
  const [uploadedUrl, setFileUrl] = useState<string>(existingDoc?.url || '');
  const [fileType, setFileType] = useState<string>(existingDoc?.fileType || '');
  
  const storage = useStorage();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const uploadTaskRef = useRef<UploadTask | null>(null);
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
      uploadTaskRef.current?.cancel();
    };
  }, [previewUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    // 1. Instant Preview
    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);
    setSelectedFile(file);

    // 2. High-Priority Background Sync
    try {
        const storageRef = ref(storage, `documents/${Date.now()}_${file.name}`);
        const task = uploadBytesResumable(storageRef, file);
        uploadTaskRef.current = task;

        task.then(async (snapshot) => {
            const url = await getDownloadURL(snapshot.ref);
            setFileUrl(url);
            setFileType(file.name.split('.').pop()?.toUpperCase() || 'FILE');
            uploadTaskRef.current = null;
        }).catch((err) => {
            if (err.code !== 'storage/canceled') {
                toast({ variant: 'destructive', title: 'Sync Blocked', description: err.message });
            }
        });
    } catch (error: any) {
        console.error("Upload Init Error:", error);
    }
  };

  const killTaskAndClear = () => {
    if (uploadTaskRef.current) {
        console.log("Kill-Task: Canceling background sync to free network.");
        uploadTaskRef.current.cancel();
        uploadTaskRef.current = null;
    }
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileUrl('');
  };

  const handleSubmit = async () => {
    const values = form.getValues();
    
    // Manual Validation & High-Speed UX
    if (!values.title?.trim() || (!uploadedUrl && !previewUrl)) {
        if (!values.title?.trim()) form.setError('title', { message: 'Title required' });
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    const dataToSave = {
      ...values,
      url: uploadedUrl,
      fileType: fileType,
      date: new Timestamp(new Date(`${values.date}T00:00:00`).getTime() / 1000, 0),
      updatedAt: serverTimestamp(),
    };

    onSave(dataToSave as any);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        <DialogHeader className="p-6 bg-primary/5 border-b shrink-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
            {existingDoc ? 'Edit Archive' : 'Add to Archive'}
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
                        <Input placeholder="E.g., Pastoral Letter" {...field} className="h-12 text-lg font-bold border-2" />
                      </FormControl>
                      <FormMessage />
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
                      <FormLabel className="font-bold">Registry Summary</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief overview of content" rows={3} {...field} className="border-2" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="space-y-4 pt-4 border-t border-dashed">
                  <FormLabel className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Document File *</FormLabel>
                  
                  {!selectedFile && !uploadedUrl && (
                    <div className="flex flex-col items-center justify-center w-full">
                        <Button asChild variant="outline" className="w-full h-32 border-dashed border-2 rounded-2xl hover:bg-muted/50 transition-colors">
                        <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
                            <Upload className="h-8 w-8 text-primary opacity-40" />
                            <span className="font-bold text-sm">SELECT DOCUMENT</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">PDF, Word, Images, etc.</span>
                            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,image/*" onChange={handleFileChange} />
                        </label>
                        </Button>
                    </div>
                  )}

                  {(selectedFile || uploadedUrl) && (
                    <div className="relative rounded-2xl border-2 p-5 bg-muted/5 animate-in fade-in zoom-in-95 group overflow-hidden isolate">
                      {/* Top-Left Kill-Task Button */}
                      <button 
                        type="button" 
                        onClick={killTaskAndClear}
                        className="absolute top-3 left-3 z-50 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center shadow-2xl hover:bg-black transition-all hover:scale-110 active:scale-95"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="flex items-center gap-5 ml-10">
                        {previewUrl && selectedFile?.type.startsWith('image/') ? (
                          <div className="relative h-16 w-16 rounded-xl overflow-hidden border-2 border-white shadow-md">
                            <Image src={previewUrl} alt="Preview" fill className="object-cover" unoptimized />
                          </div>
                        ) : (
                          <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/5">
                            <FileText className="h-8 w-8" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black truncate">{selectedFile?.name || 'Synced Registry Item'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {uploadedUrl ? (
                                <Badge className="bg-green-600 text-[9px] h-4 font-black uppercase tracking-tighter">CLOUD SYNCED</Badge>
                            ) : (
                                <Badge variant="outline" className="text-[9px] h-4 font-black uppercase tracking-tighter animate-pulse">Syncing Network...</Badge>
                            )}
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{fileType}</span>
                          </div>
                        </div>
                      </div>
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
                        <FormLabel className="font-bold">Live Public Entry</FormLabel>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-1">Visible to all parishioners once saved</p>
                      </div>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
        </div>

        <DialogFooter className="p-6 bg-muted/10 border-t shrink-0 gap-4">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-full h-12 px-8 font-bold border-2">Cancel</Button>
          <Button type="button" onClick={handleSubmit} className="rounded-full h-12 px-12 font-black shadow-xl">COMMIT TO REGISTRY</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
