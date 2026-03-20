'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Expand, MapPin, Clock, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Timestamp, collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useStorage } from '@/firebase';
import { uploadSingleFile, uploadMultipleFiles } from '@/lib/upload-utils';

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
import { ImageUpload } from './ImageUpload';
import { MultiImageUpload } from './MultiImageUpload';
import { useToast } from '@/hooks/use-toast';

const eventSchema = z.object({
  title: z.string().min(3, 'Title is required.'),
  category: z.enum(['Mass', 'Ministry', 'Community', 'Special', 'Other', 'Youth']),
  description: z.string().min(10, 'Description is required.'),
  date: z.string().min(1, 'Date is required.'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format."),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format.").optional().or(z.literal('')),
  location: z.string().min(3, 'Location is required.'),
  imageUrl: z.string().default(''),
  featured: z.boolean(),
  galleryImages: z.array(z.string()).default([]),
});

type EventFormProps = {
  event: Event | null;
  onClose: () => void;
};

const formatDateForInput = (date: any) => {
    if (!date) return '';
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return format(d, 'yyyy-MM-dd');
};

export function EventForm({ event, onClose }: EventFormProps) {
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

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

  const handleSubmit = async () => {
    if (!firestore || !storage) return;
    
    const values = form.getValues();
    if (!values.title?.trim()) return;

    setIsSaving(true);

    try {
        // 1. Await media uploads first
        let finalBannerUrl = values.imageUrl;
        if (bannerFile) {
            finalBannerUrl = await uploadSingleFile(storage, 'events', bannerFile);
        }

        const newGalleryUrls = (galleryFiles.length > 0) 
            ? await uploadMultipleFiles(storage, 'event-gallery', galleryFiles) 
            : [];
        
        const finalGalleryImages = [...(values.galleryImages || []), ...newGalleryUrls];

        // 2. Prepare Database Payload
        const eventData = {
            ...values,
            imageUrl: finalBannerUrl,
            galleryImages: finalGalleryImages,
            date: Timestamp.fromDate(new Date(`${values.date}T00:00:00`)),
            updatedAt: serverTimestamp(),
        };

        // 3. Execute Database Write
        if (event?.id) {
            await updateDoc(doc(firestore, 'events', event.id), eventData);
        } else {
            await addDoc(collection(firestore, 'events'), {
                ...eventData,
                createdAt: serverTimestamp(),
            });
        }

        // 4. Strict Success Toast
        toast({ title: 'Success: Saved to Database' });
        onClose();
    } catch (error: any) {
        console.error('[EventForm] Submission Error:', error);
        toast({ 
            variant: 'destructive', 
            title: 'Registry Error', 
            description: 'Failed to save to database. Please check your connection.' 
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
              {event ? 'Edit Event' : 'Schedule New Event'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 border-b">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Details</TabsTrigger>
                    <TabsTrigger value="gallery">Archives & Photos</TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1">
                <TabsContent value="basic" className="p-6 m-0">
                    <Form {...form}>
                        <form id="event-form" className="space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <FormField control={form.control} name="title" render={({ field }) => (
                                    <FormItem className="sm:col-span-2">
                                        <FormLabel className="font-bold">Event Name *</FormLabel>
                                        <FormControl><Input placeholder="E.g., Parish Picnic" {...field} disabled={isSaving} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="category" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold">Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving}>
                                            <FormControl><SelectTrigger className="h-12"><SelectValue/></SelectTrigger></FormControl>
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
                                        <FormItem><FormLabel className="text-xs font-bold uppercase"><CalendarIcon className="h-3.5 w-3.5 inline mr-1" /> Date *</FormLabel><FormControl><Input type="date" {...field} disabled={isSaving} /></FormControl></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="time" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs font-bold uppercase"><Clock className="h-3.5 w-3.5 inline mr-1" /> Start *</FormLabel><FormControl><Input type="time" {...field} disabled={isSaving} /></FormControl></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="endTime" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs font-bold uppercase">End Time</FormLabel><FormControl><Input type="time" {...field} disabled={isSaving} /></FormControl></FormItem>
                                    )}/>
                                </div>
                                <FormField control={form.control} name="location" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs font-bold uppercase"><MapPin className="h-3.5 w-3.5 inline mr-1" /> Location *</FormLabel><FormControl><Input placeholder="Parish Hall" {...field} disabled={isSaving} /></FormControl></FormItem>
                                )}/>
                            </div>

                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <div className="flex justify-between items-center">
                                        <FormLabel className="font-bold">Description *</FormLabel>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => setIsDescriptionModalOpen(true)} disabled={isSaving}><Expand className="h-4 w-4" /></Button>
                                    </div>
                                    <FormControl><Textarea rows={5} {...field} disabled={isSaving} /></FormControl>
                                    <FormMessage />
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
                                      folder="events" 
                                      label="Main Event Banner Photo *" 
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}/>

                            <FormField control={form.control} name="featured" render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 rounded-xl border-2 p-4 bg-white shadow-sm">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSaving} /></FormControl>
                                    <div className="space-y-1 leading-none"><FormLabel className="font-bold">High Priority (Featured)</FormLabel></div>
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
                        label="Event Archive Gallery"
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
              title="Edit Event Details"
            />
        )}
        <DialogFooter className="p-6 border-t bg-muted/5 mt-auto gap-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full h-12 px-8 font-bold border-2" disabled={isSaving}>Cancel</Button>
            <Button 
                type="button" 
                onClick={handleSubmit} 
                className="rounded-full h-12 px-12 font-black shadow-xl"
                disabled={isSaving}
            >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {event ? 'SAVE CHANGES' : 'PUBLISH EVENT'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}