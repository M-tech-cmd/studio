'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, FileText, X } from 'lucide-react';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import type { Document } from '@/lib/types';
import { useStorage } from '@/firebase';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const documentSchema = z.object({
  title: z.string().min(1, 'Document Title is required.'),
  description: z.string().default(''),
  category: z.enum(['Bulletin', 'Newsletter', 'Form', 'Policy', 'Announcement', 'Other']),
  date: z.string({ required_error: 'Date is required.' }).min(1, 'Date is required.'),
  public: z.boolean().default(true),
  url: z.string().optional(),
  fileType: z.string().optional(),
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

export function DocumentForm({ document, onSave, onClose }: DocumentFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const storage = useStorage();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof documentSchema>>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: document?.title || '',
      description: document?.description || '',
      category: document?.category || 'Bulletin',
      date: document ? formatDateForInput(document.date) : format(new Date(), 'yyyy-MM-dd'),
      public: document ? document.public : true,
      url: document?.url || '',
      fileType: document?.fileType || ''
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

  const onSubmit = async (values: z.infer<typeof documentSchema>) => {
    if (!selectedFile && !document?.url) {
      toast({ variant: 'destructive', title: 'File required', description: 'Please select a document to upload.' });
      return;
    }

    let finalUrl = values.url || '';
    let finalFileType = values.fileType || '';

    try {
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
        date: new Date(`${values.date}T00:00:00`),
        public: values.public,
        id: document?.id,
      };

      onSave(dataToSave);
    } catch (error: any) {
      console.error('Upload error:', error.code, error.message);
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
    }
  };

  const isImage = (file: File | null) => file?.type.startsWith('image/');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        <DialogHeader className="p-6 bg-primary/5 border-b">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
            {document ? 'Edit Registry' : 'New Document'}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1">
          <div className="p-8">
            <Form {...form}>
              <form id="document-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Document Title *</FormLabel>
                      <FormControl><Input placeholder="E.g., Weekly Bulletin" {...field} className="h-12 text-lg font-bold" /></FormControl>
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
                          <FormControl><SelectTrigger className="h-12"><SelectValue /></SelectTrigger></FormControl>
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
                        <FormControl><Input type="date" {...field} className="h-12" /></FormControl>
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
                      <FormControl><Textarea placeholder="Brief overview of content" rows={3} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 pt-4 border-t border-dashed">
                  <FormLabel className="font-black text-xs uppercase tracking-widest text-muted-foreground">Document File</FormLabel>
                  
                  <div className="flex flex-col items-center justify-center w-full">
                    <Button asChild variant="outline" className="w-full h-24 border-dashed border-2 rounded-2xl hover:bg-muted/50">
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
                        {isImage(selectedFile) && previewUrl ? (
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

                  {!selectedFile && document?.url && (
                    <div className="rounded-2xl border-2 p-4 bg-primary/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileText className="h-6 w-6 text-primary" />
                            <span className="text-sm font-bold">Existing Attachment</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/30 text-primary">Synced</Badge>
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
        </ScrollArea>

        <DialogFooter className="p-6 bg-muted/10 border-t mt-auto gap-4">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-full h-12 px-8">
            Cancel
          </Button>
          <Button type="submit" form="document-form" className="rounded-full h-12 px-12 font-black shadow-xl">
            {document ? 'SAVE CHANGES' : 'CREATE DOCUMENT'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}