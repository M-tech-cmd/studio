'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dynamic from 'next/dynamic';

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
  FormDescription,
} from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from '../ui/rich-text-editor';

// Lazy load uploader to prevent ChunkLoadError
const MultiImageUpload = dynamic(() => import('./MultiImageUpload').then(mod => mod.MultiImageUpload), {
  ssr: false,
  loading: () => <div className="h-24 w-full animate-pulse bg-muted rounded-2xl" />
});

const postSchema = z.object({
  title: z.string().min(3, 'Title is required.'),
  content: z.string().min(10, 'Content is required.'),
  category: z.string().min(2, 'Category is required.'),
  galleryImages: z.array(z.string()).default([]),
});

type BulletinPostFormProps = {
  post: BulletinPost | null;
  onSave: (data: Partial<BulletinPost>) => void;
  onClose: () => void;
};

export function BulletinPostForm({ post, onSave, onClose }: BulletinPostFormProps) {
  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: post?.title || '',
      content: post?.content || '',
      category: post?.category || 'Announcement',
      galleryImages: post?.galleryImages || [],
    },
  });

  const onSubmit = (values: z.infer<typeof postSchema>) => {
    // INSTANT SAVE: Filter out local blob URLs and proceed immediately
    const readyImages = values.galleryImages.filter(url => !url.startsWith('blob:'));
    onSave({ id: post?.id, ...values, galleryImages: readyImages });
  };
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{post ? 'Edit Post' : 'Create New Post'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 border-b">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Bulletin Content</TabsTrigger>
                    <TabsTrigger value="gallery">Media & Photos</TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1">
                <TabsContent value="basic" className="p-6 m-0">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} id="bulletin-form" className="space-y-6">
                            <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Post Title</FormLabel>
                                <FormControl><Input placeholder="Enter a descriptive title" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}/>

                            <FormField control={form.control} name="category" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <FormControl><Input placeholder="e.g., Fundraising, Youth, Special Event" {...field} /></FormControl>
                                <FormDescription>Type any category name to group your posts.</FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}/>

                            <FormField control={form.control} name="content" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Content</FormLabel>
                                <FormControl><RichTextEditor value={field.value} onChange={field.onChange} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}/>
                        </form>
                    </Form>
                </TabsContent>

                <TabsContent value="gallery" className="p-6 m-0">
                    <MultiImageUpload 
                        images={form.watch('galleryImages')} 
                        onChange={(imgs) => form.setValue('galleryImages', imgs)} 
                        folder="bulletin-gallery" 
                    />
                </TabsContent>
            </ScrollArea>
        </Tabs>

        <DialogFooter className="p-6 border-t bg-muted/5 mt-auto">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
            <Button type="submit" form="bulletin-form" className="rounded-full px-8 font-bold">
                {post ? 'Save Changes' : 'Create Post'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
