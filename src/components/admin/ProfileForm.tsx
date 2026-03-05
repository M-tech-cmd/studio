'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Upload, X, Sparkles, Loader2, Expand, Image as ImageIcon } from 'lucide-react';

import type { Profile } from '@/lib/types';
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
import { PhoneInput } from '../ui/phone-input';
import { handleGenerateProfilePhoto } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { LargeTextEditModal } from './LargeTextEditModal';


const profileSchema = z.object({
  name: z.string().min(3, 'Full Name must be at least 3 characters.'),
  title: z.string().min(3, 'Title/Position is required.'),
  role: z.enum(['Pastor', 'Associate Pastor', 'Deacon', 'Staff', 'Ministry Leader']),
  bio: z.string().min(10, 'Biography is required.'),
  email: z.string().email('Please enter a valid email.'),
  phone: z.string().min(1, 'Phone number is required.'),
  imageUrl: z.string().url('Please enter a valid URL or upload a photo.').optional().or(z.literal('')),
  imageHint: z.string().optional(),
  active: z.boolean().default(true),
});

type ProfileFormProps = {
  profile: Profile | null;
  onSave: (data: Omit<Profile, 'id'> & { id?: string }) => void;
  onClose: () => void;
};

export function ProfileForm({ profile, onSave, onClose }: ProfileFormProps) {
  const [isGeneratingPhoto, setIsGeneratingPhoto] = useState(false);
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
      title: profile?.title || '',
      role: profile?.role || 'Staff',
      bio: profile?.bio || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      imageUrl: profile?.imageUrl || '',
      imageHint: profile?.imageHint || '',
      active: profile ? profile.active !== false : true,
    },
  });

  const imagePreview = form.watch('imageUrl');

  useEffect(() => {
    setImageError(false);
  }, [imagePreview]);


  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    const dataToSave = {
      ...values,
      id: profile?.id,
    };
    onSave(dataToSave);
  };

  const handleGeneratePhotoClick = async () => {
    const name = form.getValues('name');
    const title = form.getValues('title');

    if (!name || !title) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please enter a name and title before generating a photo.',
      });
      return;
    }

    setIsGeneratingPhoto(true);
    const result = await handleGenerateProfilePhoto({ name, title });
    setIsGeneratingPhoto(false);

    if (result.success && result.data?.photoDataUri) {
      form.setValue('imageUrl', result.data.photoDataUri);
      toast({
        title: 'Photo Generated',
        description: 'A new profile photo has been generated and set.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: result.error || 'Could not generate the profile photo.',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        form.setValue('imageUrl', dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };
  

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{profile ? 'Edit Profile' : 'Add New Profile'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-6 -mx-6">
            <div className="px-6 py-4">
                <Form {...form}>
                <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl><Input placeholder="E.g., Deacon James Thompson" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title/Position *</FormLabel>
                          <FormControl><Input placeholder="E.g., Permanent Deacon" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {['Pastor', 'Associate Pastor', 'Deacon', 'Staff', 'Ministry Leader'].map((role) => (
                              <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel>Biography</FormLabel>
                            <Button type="button" variant="ghost" size="icon" onClick={() => setIsBioModalOpen(true)}>
                                <Expand className="h-4 w-4" />
                            </Button>
                        </div>
                        <FormControl><Textarea placeholder="Tell us about this person" className="resize-y" rows={4} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl><Input type="email" placeholder="person@example.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <PhoneInput
                              placeholder="712 345 678"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {imagePreview && (imagePreview.startsWith('http') || imagePreview.startsWith('data:')) && (
                    <div className="mt-4">
                        <FormLabel>Image Preview</FormLabel>
                        <div className="mt-2 relative w-40 h-40 rounded-full border p-2 mx-auto isolate">
                            {imageError ? (
                                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-muted text-muted-foreground">
                                    <ImageIcon className="h-16 w-16" />
                                    <p className="mt-2 text-xs text-center">Invalid Image</p>
                                </div>
                            ) : (
                                <Image 
                                    src={imagePreview} 
                                    alt="Profile image preview" 
                                    fill 
                                    className="object-cover rounded-full" 
                                    unoptimized
                                    onError={() => setImageError(true)}
                                />
                            )}
                            <Button 
                              variant="secondary" 
                              size="icon" 
                              className="absolute top-0 right-0 h-8 w-8 rounded-full shadow-lg z-50 bg-white text-black border border-black/10 hover:bg-white/90" 
                              onClick={() => { form.setValue('imageUrl', ''); setImageError(false); }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                   )}

                  <div>
                    <FormLabel>Profile Photo</FormLabel>
                    <div className="flex items-center gap-4 mt-2">
                        <Button type="button" variant="outline" size="icon" onClick={handleGeneratePhotoClick} disabled={isGeneratingPhoto}>
                            {isGeneratingPhoto ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5"/>}
                        </Button>
                        <div className="flex-grow">
                             <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*"/>
                             <Button asChild variant="outline" className="w-full">
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Photo
                                </label>
                            </Button>
                        </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active profile (visible on website)</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>
        </ScrollArea>
        {isBioModalOpen && (
            <LargeTextEditModal
                isOpen={isBioModalOpen}
                onClose={() => setIsBioModalOpen(false)}
                initialValue={form.getValues('bio') || ''}
                onSave={(newValue) => {
                    form.setValue('bio', newValue);
                }}
                title="Edit Biography"
            />
        )}
        <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="profile-form">{profile ? 'Update Profile' : 'Create Profile'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
