'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { useFirestore, useStorage } from '@/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { uploadMultipleFiles } from '@/lib/upload-utils';

import type { BulletinPost } from '@/lib/types';
import { Button } from '@/components/ui/button';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from '../ui/rich-text-editor';
import { MultiImageUpload } from './MultiImageUpload';
import { useToast } from '@/hooks/use-toast';

const postSchema = z.object({
  title: z.string().min(3, 'Title is required.'),
  content: z.string().min(10, 'Content is required.'),
  category: z.string().min(2, 'Category is required.'),
  galleryImages: z.array(z.string()).default([]),
});

type BulletinPostFormProps = {
  post: BulletinPost | null;
  author: { uid: string; name: string };
  onClose: () => void;
};

export function BulletinPostForm({ post, author, onClose }: BulletinPostFormProps) {
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: post?.title || '',
      content: post?.content || '',
      category: post?.category || 'Announcement',
      galleryImages: post?.galleryImages || [],
    },
  });

  const handleSubmit = async () => {
    if (!firestore || !storage) return;
    
    const values = form.getValues();
    if (!values.title?.trim()) return;

    setIsSaving(true);

    try {
        // 1. Await media uploads
        const newUrls = (galleryFiles.length > 0) 
            ? await uploadMultipleFiles(storage, 'bulletin-gallery', galleryFiles) 
            : [];
        
        const finalGallery = [...(values.galleryImages || []), ...newUrls];

        // 2. Prepare Payload
        const postData = {
            ...values,
            galleryImages: finalGallery,
            updatedAt: serverTimestamp(),
        };

        // 3. Execute Write
        if (post?.id) {
            await updateDoc(doc(firestore, 'bulletins', post.id), postData);
        } else {
            await addDoc(collection(firestore, 'bulletins'), {
                ...postData,
                authorId: author.uid,
                authorName: author.name,
                createdAt: serverTimestamp(),
                reactions: {},
            });
        }

        // 4. Strict Success
        toast({ title: 'Success: Saved to Database' });
        onClose();
    } catch (error: any) {
        console.error('[BulletinForm] Error:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to publish to the community feed.' });
    } finally {
        setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        <DialogHeader className="p-6 bg-primary/5 border-b shrink-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
            {post ? 'Modify Post' : 'Compose Bulletin'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 border-b">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Content</TabsTrigger>
                    <TabsTrigger value="gallery">Media Archives</TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1">
                <TabsContent value="basic" className="p-6 m-0">
                    <Form {...form}>
                        <form id="bulletin-form" className="space-y-6">
                            <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold">Announcement Title</FormLabel>
                                <FormControl><Input placeholder="Enter a descriptive title" {...field} disabled={isSaving} className="h-12 text-lg font-bold" /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}/>

                            <FormField control={form.control} name="category" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold">Category</FormLabel>
                                <FormControl><Input placeholder="e.g., Fundraising, Youth, Parish News" {...field} disabled={isSaving} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}/>

                            <FormField control={form.control} name="content" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold">Body Content</FormLabel>
                                <FormControl><RichTextEditor value={field.value} onChange={field.onChange} /></FormControl>
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
                        label="Post Media Assets"
                    />
                </TabsContent>
            </ScrollArea>
        </Tabs>

        <DialogFooter className="p-6 border-t bg-muted/5 mt-auto gap-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full h-12 px-8 font-bold border-2" disabled={isSaving}>Cancel</Button>
            <Button 
                type="button" 
                onClick={handleSubmit} 
                className="rounded-full h-12 px-12 font-black shadow-xl"
                disabled={isSaving}
            >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {post ? 'SAVE CHANGES' : 'PUBLISH TO BULLETIN'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}