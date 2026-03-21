'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Expand, Target, TrendingUp, Loader2 } from 'lucide-react';
import { useFirestore, useStorage } from '@/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { uploadSingleFile, uploadMultipleFiles } from '@/lib/upload-utils';

import type { DevelopmentProject } from '@/lib/types';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LargeTextEditModal } from './LargeTextEditModal';
import { ImageUpload } from './ImageUpload';
import { MultiImageUpload } from './MultiImageUpload';
import { useToast } from '@/hooks/use-toast';

const projectSchema = z.object({
  title: z.string().min(3, 'Title required.'),
  description: z.string().min(10, 'Description required.'),
  goalAmount: z.coerce.number().min(1, 'Goal required.'),
  currentAmount: z.coerce.number().min(0).default(0),
  status: z.enum(['Upcoming', 'Ongoing', 'Completed']),
  imageUrl: z.string().default(''),
  public: z.boolean().default(true),
  galleryImages: z.array(z.string()).default([]),
});

type DevelopmentProjectFormProps = {
  project: DevelopmentProject | null;
  onClose: () => void;
};

export function DevelopmentProjectForm({ project, onClose }: DevelopmentProjectFormProps) {
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project?.title || '',
      description: project?.description || '',
      goalAmount: project?.goalAmount || 0,
      currentAmount: project?.currentAmount || 0,
      status: project?.status || 'Ongoing',
      imageUrl: project?.imageUrl || '',
      public: project?.public ?? true,
      galleryImages: project?.galleryImages || [],
    },
  });

  const handleSubmit = async () => {
    if (!firestore || !storage) return;
    
    const values = form.getValues();
    if (!values.title?.trim()) return;

    setIsSaving(true);

    try {
        let finalBannerUrl = values.imageUrl;
        if (bannerFile) {
            finalBannerUrl = await uploadSingleFile(storage, 'projects', bannerFile);
        }

        const newGalleryUrls = (galleryFiles.length > 0) 
            ? await uploadMultipleFiles(storage, 'projects', galleryFiles) 
            : [];
        
        const finalGallery = [...(values.galleryImages || []), ...newGalleryUrls];

        const projectData = {
            ...values,
            imageUrl: finalBannerUrl,
            galleryImages: finalGallery,
            updatedAt: serverTimestamp(),
        };

        if (project?.id) {
            await updateDoc(doc(firestore, 'development_projects', project.id), projectData);
        } else {
            await addDoc(collection(firestore, 'development_projects'), {
                ...projectData,
                createdAt: serverTimestamp(),
            });
        }

        toast({ title: 'Success: Saved to Database' });
        onClose();
    } catch (error: any) {
        console.error('[ProjectForm] Sync Error:', error);
        toast({ 
            variant: 'destructive', 
            title: 'Upload Failed', 
            description: 'Upload blocked by Browser/CORS. Check Console.' 
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        <DialogHeader className="p-6 bg-primary/5 border-b shrink-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
            {project ? 'Modify Project' : 'Launch New Project'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 border-b">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Case Details</TabsTrigger>
                    <TabsTrigger value="gallery">Media Gallery</TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1">
                <TabsContent value="basic" className="p-6 m-0">
                    <Form {...form}>
                        <form id="project-form" className="space-y-8">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel className="font-bold">Project Title *</FormLabel><FormControl><Input {...field} disabled={isSaving} className="h-12 text-lg font-bold" /></FormControl></FormItem>
                            )}/>
                            
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <div className="flex justify-between items-center"><FormLabel className="font-bold">Narrative Case *</FormLabel><Button type="button" variant="ghost" size="icon" onClick={() => setIsDescriptionModalOpen(true)} disabled={isSaving}><Expand className="h-4 w-4" /></Button></div>
                                    <FormControl><Textarea rows={5} {...field} disabled={isSaving} /></FormControl>
                                </FormItem>
                            )}/>

                            <div className="bg-primary/5 p-6 rounded-2xl border-2 border-primary/10 grid grid-cols-2 gap-6 shadow-inner">
                                <FormField control={form.control} name="currentAmount" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs font-black uppercase tracking-widest opacity-60"><TrendingUp className="h-3 w-3 inline mr-1" /> Raised (KES)</FormLabel><FormControl><Input type="number" {...field} disabled={isSaving} className="h-12 font-bold" /></FormControl></FormItem>
                                )}/>
                                <FormField control={form.control} name="goalAmount" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs font-black uppercase tracking-widest opacity-60"><Target className="h-3 w-3 inline mr-1" /> Total Goal (KES)</FormLabel><FormControl><Input type="number" {...field} disabled={isSaving} className="h-12 font-bold" /></FormControl></FormItem>
                                )}/>
                            </div>

                            <FormField control={form.control} name="status" render={({ field }) => (
                                <FormItem><FormLabel className="font-bold">Project Lifecycle</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving}>
                                    <FormControl><SelectTrigger className="h-12"><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>{['Upcoming', 'Ongoing', 'Completed'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select></FormItem>
                            )}/>

                            <FormField name="imageUrl" render={() => (
                                <FormItem>
                                    <ImageUpload 
                                      value={form.watch('imageUrl')} 
                                      file={bannerFile}
                                      onChange={(url, file) => {
                                        form.setValue('imageUrl', url);
                                        setBannerFile(file);
                                      }}
                                      folder="projects" 
                                      label="Main Project Visual *" 
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}/>

                            <FormField control={form.control} name="public" render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 rounded-2xl border-2 p-6 bg-white shadow-sm">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSaving} className="h-6 w-6" /></FormControl>
                                    <div className="space-y-1 leading-none"><FormLabel className="font-bold">Live Visibility</FormLabel><p className="text-xs text-muted-foreground">Visible to the public once committed.</p></div>
                                </FormItem>
                            )}/>
                        </form>
                    </Form>
                </TabsContent>

                <TabsContent value="gallery" className="p-6 m-0">
                    <MultiImageUpload 
                        existingImages={form.watch('galleryImages')} 
                        newFiles={galleryFiles}
                        onChange={(existing, files) => {
                          form.setValue('galleryImages', existing);
                          setGalleryFiles(files);
                        }}
                        label="Project Milestones & Photos"
                    />
                </TabsContent>
            </ScrollArea>
        </Tabs>

        {isDescriptionModalOpen && (
          <LargeTextEditModal isOpen={isDescriptionModalOpen} onClose={() => setIsDescriptionModalOpen(false)} initialValue={form.getValues('description') || ''} onSave={(newValue) => form.setValue('description', newValue)} title="Edit Project Case" />
        )}
        <DialogFooter className="p-6 border-t bg-muted/5 mt-auto gap-4">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-full h-12 px-8" disabled={isSaving}>Cancel</Button>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            className="rounded-full h-12 px-12 font-black shadow-xl"
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {project ? 'SAVE CHANGES' : 'COMMIT PROJECT'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
