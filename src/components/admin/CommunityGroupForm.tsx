'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dynamic from 'next/dynamic';
import { Expand, User, Clock, Mail } from 'lucide-react';

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

// Lazy load uploader to prevent ChunkLoadError
const MultiImageUpload = dynamic(() => import('./MultiImageUpload').then(mod => mod.MultiImageUpload), {
  ssr: false,
  loading: () => <div className="h-24 w-full animate-pulse bg-muted rounded-2xl" />
});

const groupSchema = z.object({
  name: z.string().min(3, 'Group Name required.'),
  type: z.enum(['Small Christian Community', 'Group', 'Choir', 'Ministry']),
  description: z.string().min(10, 'Description required.'),
  goals: z.string().optional(),
  leader: z.string().min(3, 'Leader name required.'),
  contact: z.string().email('Valid email required.'),
  schedule: z.string().min(3, 'Schedule required.'),
  imageUrl: z.string().url('Image URL required.'),
  memberCount: z.coerce.number().min(0).default(0),
  familyCount: z.coerce.number().min(0).default(0),
  galleryImages: z.array(z.string()).default([]),
});

type CommunityGroupFormProps = {
  group: CommunityGroup | null;
  onSave: (data: Omit<CommunityGroup, 'id'> & { id?: string }) => void;
  onClose: () => void;
};

export function CommunityGroupForm({ group, onSave, onClose }: CommunityGroupFormProps) {
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);

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

  const onSubmit = (values: z.infer<typeof groupSchema>) => {
    // INSTANT SAVE: Proceed with ready URLs
    const readyImages = values.galleryImages.filter(url => !url.startsWith('blob:'));
    onSave({ ...values, id: group?.id, galleryImages: readyImages });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
            {group ? 'Edit Community' : 'Add Community'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 border-b">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Core Info</TabsTrigger>
                    <TabsTrigger value="gallery">Media Gallery</TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1">
                <TabsContent value="basic" className="p-6 m-0">
                    <Form {...form}>
                        <form id="group-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel className="font-bold">Group Name *</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                )}/>
                                <FormField control={form.control} name="type" render={({ field }) => (
                                    <FormItem><FormLabel className="font-bold">Classification</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-12"><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>{['Small Christian Community', 'Group', 'Choir', 'Ministry'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></FormItem>
                                )}/>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                                <FormField control={form.control} name="leader" render={({ field }) => (
                                    <FormItem><FormLabel className="font-bold flex items-center gap-2"><User className="h-4 w-4" /> Leader *</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                )}/>
                                <FormField control={form.control} name="contact" render={({ field }) => (
                                    <FormItem><FormLabel className="font-bold flex items-center gap-2"><Mail className="h-4 w-4" /> Contact Email *</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>
                                )}/>
                            </div>

                            <FormField control={form.control} name="schedule" render={({ field }) => (
                                <FormItem><FormLabel className="font-bold flex items-center gap-2"><Clock className="h-4 w-4" /> Meeting Schedule *</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                            )}/>

                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <div className="flex justify-between items-center"><FormLabel className="font-bold">Public Description *</FormLabel><Button type="button" variant="ghost" size="icon" onClick={() => setIsDescriptionModalOpen(true)}><Expand className="h-4 w-4" /></Button></div>
                                    <FormControl><Textarea rows={4} {...field} /></FormControl>
                                </FormItem>
                            )}/>

                            <FormField control={form.control} name="imageUrl" render={({ field }) => (
                                <FormItem><FormLabel className="font-bold">Banner Image URL *</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl></FormItem>
                                )}/>
                        </form>
                    </Form>
                </TabsContent>

                <TabsContent value="gallery" className="p-6 m-0">
                    <MultiImageUpload 
                        images={form.watch('galleryImages')} 
                        onChange={(imgs) => form.setValue('galleryImages', imgs)} 
                        folder="community-gallery" 
                    />
                </TabsContent>
            </ScrollArea>
        </Tabs>

        {isDescriptionModalOpen && (
          <LargeTextEditModal isOpen={isDescriptionModalOpen} onClose={() => setIsDescriptionModalOpen(false)} initialValue={form.getValues('description') || ''} onSave={(newValue) => form.setValue('description', newValue)} title="Edit Description" />
        )}
        <DialogFooter className="p-6 border-t bg-muted/5 mt-auto">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
            <Button type="submit" form="group-form" className="rounded-full px-8 font-bold">
                {group ? 'Save Changes' : 'Create Entity'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
