
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dynamic from 'next/dynamic';
import { Expand, MapPin, Clock, Calendar as CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

import type { Event } from '@/lib/types';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { LargeTextEditModal } from './LargeTextEditModal';

const MultiImageUpload = dynamic(() => import('./MultiImageUpload').then(mod => mod.MultiImageUpload), {
  ssr: false,
  loading: () => <div className="h-24 w-full animate-pulse bg-muted rounded-2xl" />
});

const eventSchema = z.object({
  title: z.string().min(3, 'Title is required.'),
  category: z.enum(['Mass', 'Ministry', 'Community', 'Special', 'Other', 'Youth']),
  description: z.string().min(10, 'Description is required.'),
  date: z.string().min(1, 'Date is required.'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format."),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format.").optional().or(z.literal('')),
  location: z.string().min(3, 'Location is required.'),
  imageUrl: z.string().url('Invalid image URL.'),
  featured: z.boolean(),
  galleryImages: z.array(z.string()).default([]),
});

type EventFormProps = {
  event: Event | null;
  onSave: (data: Omit<Event, 'id'> & { id?: string }) => void;
  onClose: () => void;
};

const formatDateForInput = (date: any) => {
    if (!date) return '';
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return format(d, 'yyyy-MM-dd');
};

export function EventForm({ event, onSave, onClose }: EventFormProps) {
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title || '',
      category: event?.category || 'Community',
      description: event?.description || '',
      date: event ? formatDateForInput(event.date) : format(new Date(), 'yyyy-MM-dd'),
      time: event?.time || '',
      endTime: event?.endTime || '',
      location: event?.location || '',
      imageUrl: event?.imageUrl || '',
      featured: event?.featured || false,
      galleryImages: event?.galleryImages || [],
    },
  });

  const onSubmit = (values: z.infer<typeof eventSchema>) => {
    const readyImages = values.galleryImages.filter(url => !url.startsWith('blob:'));
    
    const dataToSave = {
      ...values,
      id: event?.id,
      date: new Timestamp(new Date(`${values.date}T00:00:00`).getTime() / 1000, 0),
      galleryImages: readyImages
    };
    onSave(dataToSave as Omit<Event, 'id'> & { id?: string });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
            {event ? 'Edit Event' : 'New Parish Event'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 border-b">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic Information</TabsTrigger>
                    <TabsTrigger value="gallery">Gallery & Archives</TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1">
                <TabsContent value="basic" className="p-6 m-0">
                    <Form {...form}>
                        <form id="event-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <FormField control={form.control} name="title" render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel className="font-bold">Event Name *</FormLabel>
                                        <FormControl><Input placeholder="E.g., Parish Picnic" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="category" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold">Event Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {['Mass', 'Ministry', 'Community', 'Special', 'Youth', 'Other'].map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}/>
                            </div>

                            <div className="bg-muted/30 p-6 rounded-2xl border-2 border-muted space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField control={form.control} name="date" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs font-bold uppercase"><CalendarIcon className="h-3 w-3 inline mr-1" /> Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="time" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs font-bold uppercase"><Clock className="h-3 w-3 inline mr-1" /> Start *</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="endTime" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs font-bold uppercase">End Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>
                                    )}/>
                                </div>
                                <FormField control={form.control} name="location" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs font-bold uppercase"><MapPin className="h-3 w-3 inline mr-1" /> Location *</FormLabel><FormControl><Input placeholder="Parish Hall" {...field} /></FormControl></FormItem>
                                )}/>
                            </div>

                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <div className="flex justify-between items-center">
                                        <FormLabel className="font-bold">Description *</FormLabel>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => setIsDescriptionModalOpen(true)}><Expand className="h-4 w-4" /></Button>
                                    </div>
                                    <FormControl><Textarea rows={5} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            
                            <FormField control={form.control} name="imageUrl" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold">Banner Image URL *</FormLabel>
                                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>

                            <FormField control={form.control} name="featured" render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 rounded-xl border-2 p-4 bg-muted/5">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <div className="space-y-1 leading-none"><FormLabel className="font-bold">High Priority Event</FormLabel></div>
                                </FormItem>
                            )}/>
                        </form>
                    </Form>
                </TabsContent>

                <TabsContent value="gallery" className="p-6 m-0">
                    <MultiImageUpload 
                        images={form.watch('galleryImages')} 
                        onChange={(imgs) => form.setValue('galleryImages', imgs)} 
                        folder="event-gallery" 
                    />
                </TabsContent>
            </ScrollArea>
        </Tabs>

        {isDescriptionModalOpen && (
            <LargeTextEditModal
              isOpen={isDescriptionModalOpen}
              onClose={() => setIsDescriptionModalOpen(false)}
              initialValue={form.getValues('description') || ''}
              onSave={(newValue) => form.setValue('description', newValue)}
              title="Edit Event Content"
            />
        )}
        <DialogFooter className="p-6 border-t bg-muted/5 mt-auto">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
            <Button type="submit" form="event-form" className="rounded-full px-8 font-bold">
                {event ? 'Save Changes' : 'Publish Event'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
