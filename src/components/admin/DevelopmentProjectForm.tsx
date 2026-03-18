'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dynamic from 'next/dynamic';
import { Expand, Target, TrendingUp } from 'lucide-react';

import type { DevelopmentProject } from '@/lib/types';
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
import { Checkbox } from '@/components/ui/checkbox';
import { LargeTextEditModal } from './LargeTextEditModal';

// Lazy load uploader to prevent ChunkLoadError
const MultiImageUpload = dynamic(() => import('./MultiImageUpload').then(mod => mod.MultiImageUpload), {
  ssr: false,
  loading: () => <div className="h-24 w-full animate-pulse bg-muted rounded-2xl" />
});

const projectSchema = z.object({
  title: z.string().min(3, 'Title required.'),
  description: z.string().min(10, 'Description required.'),
  goalAmount: z.coerce.number().min(1, 'Goal required.'),
  currentAmount: z.coerce.number().min(0).default(0),
  status: z.enum(['Upcoming', 'Ongoing', 'Completed']),
  imageUrl: z.string().url('Image URL required.'),
  public: z.boolean().default(true),
  galleryImages: z.array(z.string()).default([]),
});

type DevelopmentProjectFormProps = {
  project: DevelopmentProject | null;
  onSave: (data: Omit<DevelopmentProject, 'id'> & { id?: string }) => void;
  onClose: () => void;
};

export function DevelopmentProjectForm({ project, onSave, onClose }: DevelopmentProjectFormProps) {
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);

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

  const onSubmit = (values: z.infer<typeof projectSchema>) => {
    // INSTANT SAVE: proceed with cloud URLs
    const readyImages = values.galleryImages.filter(url => !url.startsWith('blob:'));
    onSave({ ...values, id: project?.id, galleryImages: readyImages });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
            {project ? 'Edit Project' : 'Launch Project'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 border-b">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Core Case</TabsTrigger>
                    <TabsTrigger value="gallery">Progress Media</TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1">
                <TabsContent value="basic" className="p-6 m-0">
                    <Form {...form}>
                        <form id="project-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel className="font-bold">Project Title *</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                            )}/>
                            
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <div className="flex justify-between items-center"><FormLabel className="font-bold">Detailed Case *</FormLabel><Button type="button" variant="ghost" size="icon" onClick={() => setIsDescriptionModalOpen(true)}><Expand className="h-4 w-4" /></Button></div>
                                    <FormControl><Textarea rows={5} {...field} /></FormControl>
                                </FormItem>
                            )}/>

                            <div className="bg-primary/5 p-6 rounded-2xl border border-dashed border-primary/20 grid grid-cols-2 gap-6">
                                <FormField control={form.control} name="currentAmount" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs font-bold uppercase"><TrendingUp className="h-3 w-3 inline mr-1" /> Raised (KES)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                )}/>
                                <FormField control={form.control} name="goalAmount" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs font-bold uppercase"><Target className="h-3 w-3 inline mr-1" /> Goal (KES)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                )}/>
                            </div>

                            <FormField control={form.control} name="status" render={({ field }) => (
                                <FormItem><FormLabel className="font-bold">Project Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                <SelectContent>{['Upcoming', 'Ongoing', 'Completed'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></FormItem>
                            )}/>

                            <FormField control={form.control} name="imageUrl" render={({ field }) => (
                                <FormItem><FormLabel className="font-bold">Banner Image URL *</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl></FormItem>
                            )}/>

                            <FormField control={form.control} name="public" render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 rounded-xl border-2 p-4 bg-muted/5">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <div className="space-y-1 leading-none"><FormLabel className="font-bold">Live Project</FormLabel></div>
                                </FormItem>
                            )}/>
                        </form>
                    </Form>
                </TabsContent>

                <TabsContent value="gallery" className="p-6 m-0">
                    <MultiImageUpload 
                        images={form.watch('galleryImages')} 
                        onChange={(imgs) => form.setValue('galleryImages', imgs)} 
                        folder="project-gallery" 
                    />
                </TabsContent>
            </ScrollArea>
        </Tabs>

        {isDescriptionModalOpen && (
          <LargeTextEditModal isOpen={isDescriptionModalOpen} onClose={() => setIsDescriptionModalOpen(false)} initialValue={form.getValues('description') || ''} onSave={(newValue) => form.setValue('description', newValue)} title="Edit Project Case" />
        )}
        <DialogFooter className="p-6 border-t bg-muted/5 mt-auto">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button type="submit" form="project-form" className="rounded-full px-8 font-bold">
            {project ? 'Save Project' : 'Launch Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
