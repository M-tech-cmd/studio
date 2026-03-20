'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileText, Trash2, ShieldCheck, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Timestamp, serverTimestamp } from 'firebase/firestore';
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
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentFileUrl, setCurrentFileUrl] = useState<string>(existingDoc?.url || '');
  
  const storage = useStorage();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleCommit = async () => {
    const values = form.getValues();
    
    if (!values.title?.trim()) {
        form.setError('title', { message: 'Required' });
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    if (!localFile && !currentFileUrl) {
        toast({ variant: 'destructive', title: 'File Missing', description: 'Please select a document.' });
        return;
    }

    try {
        let finalUrl = currentFileUrl;
        let finalType = existingDoc?.fileType || 'FILE';

        if (localFile && storage) {
            const storageRef = ref(storage, `documents/${Date.now()}_${localFile.name}`);
            const snapshot = await uploadBytes(storageRef, localFile);
            finalUrl = await getDownloadURL(snapshot.ref);
            finalType = localFile.name.split('.').pop()?.toUpperCase() || 'FILE';
        }

        const dataToSave = {
            ...values,
            url: finalUrl,
            fileType: finalType,
            date: new Timestamp(new Date(`${values.date}T00:00:00`).getTime() / 1000, 0),
            updatedAt: serverTimestamp(),
        };

        onSave(dataToSave as any);
        toast({ title: 'Registry Updated' });
        onClose();
    } catch (error: any) {
        console.error("Document Sync Error:", error);
        const isConnectionError = error.message?.includes('ERR_PROXY_CONNECTION_FAILED') || 
                                 error.message?.includes('Network Error') ||
                                 error.code === 'storage/retry-limit-exceeded';

        toast({ 
            variant: 'destructive', 
            title: isConnectionError ? 'Connection Error' : 'Upload Error', 
            description: isConnectionError 
                ? 'Connection Error: Please check your firewall or Firebase CORS settings.' 
                : 'Failed to sync document to the registry.' 
        });
    }
  };

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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        <DialogHeader className="p-6 bg-primary/5 border-b shrink-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
            Registry Archive
          </DialogTitle>
        </DialogHeader>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8">
            <Form {...form}>
              <form className="space-y-8">
                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Document Title *</FormLabel>
                      <FormControl><Input placeholder="Pastoral Letter" {...field} className="h-12 text-lg font-bold border-2" /></FormControl>
                      <FormMessage />
                    </FormItem>
                )}/>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField control={form.control} name="category" render={({ field }) => (
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
                  )}/>
                  <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Date *</FormLabel>
                        <FormControl><Input type="date" {...field} className="h-12 border-2" /></FormControl>
                        <FormMessage />
                      </FormItem>
                  )}/>
                </div>

                <div className="space-y-4 pt-4 border-t border-dashed">
                  <FormLabel className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">File Asset</FormLabel>
                  
                  {!localFile && !currentFileUrl && (
                    <div className="flex flex-col items-center justify-center w-full">
                        <Button asChild variant="outline" className="w-full h-32 border-dashed border-2 rounded-2xl hover:bg-muted/50 transition-colors">
                        <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
                            <FileText className="h-8 w-8 text-primary opacity-40" />
                            <span className="font-bold text-sm">SELECT FILE</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">PDF, Word, Images, etc.</span>
                            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,image/*" onChange={handleFileChange} />
                        </label>
                        </Button>
                    </div>
                  )}

                  {(localFile || currentFileUrl) && (
                    <div className="relative rounded-2xl border-2 p-5 bg-muted/5 animate-in fade-in zoom-in-95 group overflow-hidden isolate">
                      <button type="button" onClick={() => { setLocalFile(null); setCurrentFileUrl(''); if(previewUrl) URL.revokeObjectURL(previewUrl); }} className="absolute top-3 left-3 z-50 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center shadow-2xl hover:bg-black transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="flex items-center gap-5 ml-10">
                        {previewUrl && localFile?.type.startsWith('image/') ? (
                          <div className="relative h-16 w-16 rounded-xl overflow-hidden border-2 border-white shadow-md">
                            <Image src={previewUrl} alt="Preview" fill className="object-cover" unoptimized />
                          </div>
                        ) : (
                          <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/5">
                            <FileText className="h-8 w-8" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black truncate">{localFile?.name || 'Archive Reference'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {currentFileUrl && !localFile ? (
                                <Badge className="bg-green-600 text-[9px] h-4 font-black uppercase tracking-tighter"><ShieldCheck className="h-2 w-2 mr-1" /> CLOUD SYNCED</Badge>
                            ) : (
                                <Badge variant="outline" className="text-[9px] h-4 font-black uppercase tracking-tighter">LOCAL SELECTION</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-2 italic flex items-center gap-1.5"><Info className="h-3 w-3" /> Supports PDF, Word, Excel, PowerPoint, images and more</p>
                </div>

                <FormField control={form.control} name="public" render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-2xl border-2 p-6 bg-white shadow-sm">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-6 w-6" /></FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-bold">Public Registry Entry</FormLabel>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-1">Visible to all parishioners once saved</p>
                      </div>
                    </FormItem>
                )}/>
              </form>
            </Form>
        </div>

        <DialogFooter className="p-6 bg-muted/10 border-t shrink-0 gap-4">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-full h-12 px-8 font-bold border-2">Cancel</Button>
          <Button type="button" onClick={handleCommit} className="rounded-full h-12 px-12 font-black shadow-xl">COMMIT TO REGISTRY</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
