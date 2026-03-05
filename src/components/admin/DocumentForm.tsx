
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, X, Link as LinkIcon, FileText, Expand, Loader2, CheckCircle2 } from 'lucide-react';
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
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { LargeTextEditModal } from './LargeTextEditModal';

const documentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().optional(),
  category: z.enum(['Bulletin', 'Newsletter', 'Form', 'Policy', 'Announcement', 'Other']),
  url: z.string().url('A file upload is required.'),
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
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
    if (file && storage) {
      setFileName(file.name);
      setIsUploading(true);
      setUploadComplete(false);
      
      try {
          const storageRef = ref(storage, `documents/${Date.now()}_${file.name}`);
          // Using direct uploadBytes Promise instead of observers to prevent 0% hang
          const snapshot = await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(snapshot.ref);
          
          form.setValue('url', downloadURL);
          form.setValue('fileType', file.name.split('.').pop()?.toUpperCase() || 'FILE');
          setUploadComplete(true);
          toast({ title: 'File Ready', description: 'Upload finished successfully.' });
      } catch (error: any) {
          console.error("Upload failed:", error);
          toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
          setFileName(null);
      } finally {
          setIsUploading(false);
      }
    }
  };
  
  const fileUrl = form.watch('url');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{document ? 'Edit Document' : 'Add New Document'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] -mx-6 pr-2">
            <div className="px-6 py-4">
                <Form {...form}>
                <form id="document-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Document Title *</FormLabel>
                        <FormControl>
                            <Input placeholder="E.g., Weekly Parish Bulletin" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center">
                            <FormLabel>Description</FormLabel>
                            <Button type="button" variant="ghost" size="icon" onClick={() => setIsDescriptionModalOpen(true)}>
                                <Expand className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormControl>
                            <Textarea
                              placeholder="A short description of the document"
                              className="resize-y"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date *</FormLabel>
                           <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
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

                    <div className="space-y-3">
                        <FormLabel>Upload File (PDF, Word, etc.)</FormLabel>
                        <div className="flex items-center justify-center w-full">
                            <Button asChild variant="outline" className="w-full h-12 border-dashed border-2">
                                <label htmlFor="doc-upload" className="cursor-pointer w-full flex items-center justify-center">
                                    {isUploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Upload className="mr-2 h-5 w-5" />}
                                    {fileName ? "Change Selection" : "Click to Select File"}
                                </label>
                            </Button>
                            <input id="doc-upload" type="file" className="hidden" onChange={handleFileChange} />
                        </div>
                        
                        {uploadComplete && (
                            <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 p-2 rounded border border-green-100">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>File Uploaded & Ready!</span>
                            </div>
                        )}

                        {fileUrl && !isUploading && (
                            <div className="mt-2 flex items-center justify-between rounded-md border p-3 bg-muted/20">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-primary"/>
                                    <span className="text-sm font-medium truncate max-w-[200px]">{fileName}</span>
                                </div>
                                <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                        <LinkIcon className="h-4 w-4"/>
                                    </a>
                                </Button>
                            </div>
                        )}
                    </div>
                    <FormField
                    control={form.control}
                    name="public"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                            <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>
                            Public document (visible to all website visitors)
                            </FormLabel>
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
            onSave={(newValue) => {
              form.setValue('description', newValue);
            }}
            title="Edit Description"
          />
        )}
        <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
            Cancel
            </Button>
            <Button type="submit" form="document-form" disabled={isUploading}>
            {document ? 'Update Document' : 'Create Document'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
