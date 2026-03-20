'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Expand, User, Clock, Mail, Loader2 } from 'lucide-react';
import { useFirestore, useStorage } from '@/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { uploadSingleFile, uploadMultipleFiles } from '@/lib/upload-utils';

import type { CommunityGroup } from '@/lib/types';
import { Button } from '@/components/ui/button';
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

const groupSchema = z.object({
  name: z.string().min(3, 'Group Name required.'),
  type: z.enum(['Small Christian Community', 'Group', 'Choir', 'Ministry']),
  description: z.string().min(10, 'Description required.'),
  goals: z.string().optional(),
  leader: z.string().min(3, 'Leader name required.'),
  contact: z.string().email('Valid email required.'),
  schedule: z.string().min(3, 'Schedule required.'),
  imageUrl: z.string().default(''),
  memberCount: z.coerce.number().min(0).default(0),
  familyCount: z.coerce.number().min(0).default(0),
  galleryImages: z.array(z.string()).default([]),
});

type CommunityGroupFormProps = {
  group: CommunityGroup | null;
  onClose: () => void;
};

export function CommunityGroupForm({ group, onClose }: CommunityGroupFormProps) {
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  const form = useForm<z.infer<typeof groupSchema>>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: group?.name || '',
      type: group?.type || 'Group',
      description: group?.description || '',
      goals: group?.goals || '',
      leader: group?.leader || '',
      contact: group?.contact || '',
      schedule: group?.schedule || '',
      imageUrl: group?.imageUrl || '',
      memberCount: group?.memberCount || 0,
      familyCount: group?.familyCount || 0,
      galleryImages: group?.galleryImages || [],
    },
  });

  const handleSubmit = async () => {
    if (!firestore || !storage) return;
    
    const values = form.getValues();
    if (!values.name?.trim()) return;

    setIsSaving(true);

    try {
        let finalBannerUrl = values.imageUrl;
        if (bannerFile) {
            finalBannerUrl = await uploadSingleFile(storage, 'communities', bannerFile);
        }

        const newGalleryUrls = (galleryFiles.length > 0) 
            ? await uploadMultipleFiles(storage, 'community-gallery', galleryFiles) 
            : [];
        
        const finalGallery = [...(values.galleryImages || []), ...newGalleryUrls];

        const groupData = {
            ...values,
            imageUrl: finalBannerUrl,
            galleryImages: finalGallery,
            updatedAt: serverTimestamp(),
        };

        if (group?.id) {
            await updateDoc(doc(firestore, 'community_groups', group.id), groupData);
        } else {
            await addDoc(collection(firestore, 'community_groups'), {
                ...groupData,
                createdAt: serverTimestamp(),
            });
        }

        toast({ title: 'Success: Saved to Database' });
        onClose();
    } catch (error: any) {
        console.error('[CommunityForm] Error:', error);
        const isConnectionError = error.message?.includes('ERR_PROXY_CONNECTION_FAILED') || 
                                 error.message?.includes('Network Error') ||
                                 error.code === 'storage/retry-limit-exceeded';

        toast({ 
            variant: 'destructive', 
            title: isConnectionError ? 'Connection Error' : 'Sync Error', 
            description: isConnectionError 
                ? 'Connection Error: Please check your firewall or Firebase CORS settings.' 
                : 'Failed to commit changes to the registry.' 
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        <DialogHeader className="p-6 bg-primary/5 border-b shrink-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
            {group ? 'Modify Community' : 'Register Community'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 border-b">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Registry</TabsTrigger>
                    <TabsTrigger value="gallery">Archives</TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1">
                <TabsContent value="basic" className="p-6 m-0">
                    <Form {...form}>
                        <form id="group-form" className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel className="font-bold">Group Name *</FormLabel><FormControl><Input {...field} disabled={isSaving} className="h-12 font-bold" /></FormControl></FormItem>
                                )}/>
                                <FormField control={form.control} name="type" render={({ field }) => (
                                    <FormItem><FormLabel className="font-bold">Classification</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving}>
                                        <FormControl><SelectTrigger className="h-12"><SelectValue/></SelectTrigger></FormControl>
                                        <SelectContent>{['Small Christian Community', 'Group', 'Choir', 'Ministry'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                    </Select></FormItem>
                                )}/>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-dashed">
                                <FormField control={form.control} name="leader" render={({ field }) => (
                                    <FormItem><FormLabel className="font-bold flex items-center gap-2"><User className="h-4 w-4" /> Leader *</FormLabel><FormControl><Input {...field} disabled={isSaving} /></FormControl></FormItem>
                                )}/>
                                <FormField control={form.control} name="contact" render={({ field }) => (
                                    <FormItem><FormLabel className="font-bold flex items-center gap-2"><Mail className="h-4 w-4" /> Contact Email *</FormLabel><FormControl><Input type="email" {...field} disabled={isSaving} /></FormControl></FormItem>
                                )}/>
                            </div>

                            <FormField control={form.control} name="schedule" render={({ field }) => (
                                <FormItem><FormLabel className="font-bold flex items-center gap-2"><Clock className="h-4 w-4" /> Active Schedule *</FormLabel><FormControl><Input placeholder="e.g. Every Sunday after 2nd Mass" {...field} disabled={isSaving} /></FormControl></FormItem>
                            )}/>

                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <div className="flex justify-between items-center"><FormLabel className="font-bold">Vision & Description *</FormLabel><Button type="button" variant="ghost" size="icon" onClick={() => setIsDescriptionModalOpen(true)} disabled={isSaving}><Expand className="h-4 w-4" /></Button></div>
                                    <FormControl><Textarea rows={4} {...field} disabled={isSaving} /></FormControl>
                                </FormItem>
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
                                      folder="communities" 
                                      label="Official Banner Image *" 
                                    />
                                    <FormMessage />
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
                        label="Community Gallery Assets"
                    />
                </TabsContent>
            </ScrollArea>
        </Tabs>

        {isDescriptionModalOpen && (
          <LargeTextEditModal isOpen={isDescriptionModalOpen} onClose={() => setIsDescriptionModalOpen(false)} initialValue={form.getValues('description') || ''} onSave={(newValue) => form.setValue('description', newValue)} title="Edit Description" />
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
                {group ? 'SAVE PROFILE' : 'REGISTER ENTITY'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
