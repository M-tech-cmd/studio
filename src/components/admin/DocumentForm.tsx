'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, FileText, Expand, CheckCircle2 } from 'lucide-react';
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
import { LargeTextEditModal } from './LargeTextEditModal';

const documentSchema = z.object({
  title: z.string().min(1, 'Document Title is required.'),
  description: z.string().optional(),
  category: z.enum(['Bulletin', 'Newsletter', 'Form', 'Policy', 'Announcement', 'Other']),
  url: z.string().min(1, 'A file upload is required.'),
  date: z.string({ required_error: 'Date is required.' }).min(1, 'Date is required.'),
  public: z.boolean().default(true),
  fileType: z.string().min(1, "File type is required.")
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
  const [fileName, setFileName] = useState<string | null>(document ? document.url.split('/').pop()?.split('?')[0].split('%2F').pop() || "Attached File" : null);
  const [uploadComplete, setUploadComplete] = useState(!!document);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const storage = useStorage();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof documentSchema>>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: document?.title || '',
      description: document?.description || '',
      category: document?.category || 'Bulletin',
      url: document?.url || '',
      date: document ? formatDateForInput(document.date) : format(new Date(), 'yyyy-MM-dd'),
      public: document ? document.public : true,
      fileType: document?.fileType || ''
    },
  });

  const onSubmit = (values: z.infer<typeof documentSchema>) => {
    const dataToSave = {
      ...values,
      id: document?.id,
      date: new Date(`${values.date}T00:00:00`),
      description: values.description || '',
    };
    onSave(dataToSave);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    try {
        const storageRef = ref(storage, `documents/${Date.now()}_${file.name}`);
        
        // Use atomic uploadBytes to prevent retry loops
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        form.setValue('url', downloadURL);
        form.setValue('fileType', file.name.split('.').pop()?.toUpperCase() || 'FILE');
        setFileName(file.name);
        setUploadComplete(true);
        toast({ title: 'File Ready', description: 'Document uploaded successfully.' });
    } catch (err: any) {
        // Detailed console logging for debugging
        console.error('Upload error:', err.code, err.message);
        toast({ 
          variant: 'destructive', 
          title: 'Upload Failed', 
          description: err.message || 'The storage request timed out or was rejected.' 
        });
        setFileName(null);
        setUploadComplete(false);
    } finally {
        // Reset file input so same file can be re-selected if needed
        if (e.target) e.target.value = '';
    }
  };
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
            {document ? 'Edit Registry Item' : 'New Parish Document'}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">
                <Form {...form}>
                <form id="document-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* DOCUMENT TITLE - REQUIRED & FIRST */}
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold">Document Title *</FormLabel>
                                <FormControl>
                                    <Input placeholder="E.g., Weekly Parish Bulletin" {...field} autoComplete="off" className="h-12 text-lg font-bold" />
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
                                    <FormControl>
                                    <SelectTrigger className="h-12">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {['Bulletin', 'Newsletter', 'Form', 'Policy', 'Announcement', 'Other'].map(
                                        (cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                        )
                                    )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="font-bold">Date *</FormLabel>
                                <FormControl>
                                        <Input type="date" {...field} className="h-12" />
                                    </FormControl>
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
                          <div className="flex justify-between items-center">
                            <FormLabel className="font-bold">Summary / Description</FormLabel>
                            <Button type="button" variant="ghost" size="icon" onClick={() => setIsDescriptionModalOpen(true)}>
                                <Expand className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormControl>
                            <Textarea
                              placeholder="A short description of the document"
                              className="resize-none"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4 pt-4 border-t border-dashed">
                        <FormLabel className="font-black text-xs uppercase tracking-widest text-muted-foreground">Digital File Attachment</FormLabel>
                        
                        <div className="flex items-center justify-center w-full">
                            <Button asChild variant="outline" className="w-full h-14 border-dashed border-2 rounded-2xl hover:bg-muted/50">
                                <label htmlFor="doc-upload" className="cursor-pointer w-full flex items-center justify-center gap-2 font-bold">
                                    <Upload className="mr-2 h-5 w-5 text-primary" />
                                    {fileName ? "Change Selection" : "Click to Select File"}
                                </label>
                            </Button>
                            <input 
                                id="doc-upload" 
                                type="file" 
                                className="hidden" 
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,image/*"
                                onChange={handleFileChange} 
                            />
                        </div>
                        
                        {fileName && (
                            <div className="flex items-center justify-between rounded-2xl border-2 p-4 bg-muted/5 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                        <FileText className="h-5 w-5"/>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold truncate">{fileName}</p>
                                        <p className="text-[10px] font-black uppercase tracking-tighter opacity-50">
                                            {form.watch('fileType') || 'Attachment'}
                                        </p>
                                    </div>
                                </div>
                                {uploadComplete && (
                                    <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100 shadow-sm">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase">Cloud Synced</span>
                                    </div>
                                )}
                            </div>
                        )}
                        <FormField control={form.control} name="url" render={() => <FormMessage />} />
                    </div>

                    <FormField
                        control={form.control}
                        name="public"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-2xl border-2 p-6 bg-white shadow-sm">
                            <FormControl>
                                <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="h-6 w-6"
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel className="font-bold">
                                Public document
                                </FormLabel>
                                <p className="text-xs text-muted-foreground italic">Visible to all website visitors once published.</p>
                            </div>
                            </FormItem>
                        )}
                    />
                </form>
                </Form>
            </div>
        </ScrollArea>

        {isDescriptionModalOpen && (
          <LargeTextEditModal
            isOpen={isDescriptionModalOpen}
            onClose={() => setIsDescriptionModalOpen(false)}
            initialValue={form.getValues('description') || ''}
            onSave={(newValue) => form.setValue('description', newValue)}
            title="Edit Document Description"
          />
        )}

        <DialogFooter className="p-6 bg-muted/5 border-t">
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