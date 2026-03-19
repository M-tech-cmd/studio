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
      name: values.name || "",
      title: values.title || "",
      role: values.role || "Staff",
      bio: values.bio || "",
      email: values.email || "",
      phone: values.phone || "",
      imageUrl: values.imageUrl || "",
      imageHint: values.imageHint || "",
      active: values.active ?? true,
      id: profile?.id,
    };
    onSave(dataToSave);
  };

  /**
   * AI Resource Exhaustion Guard.
   * Ensures the Gemini call only triggers once per click.
   * If failure occurs, user must manually re-initiate to prevent 429 errors.
   */
  const handleGeneratePhotoClick = async () => {
    if (isGeneratingPhoto) return; // Block double-clicks

    const name = form.getValues('name');
    const title = form.getValues('title');

    if (!name || !title) {
      toast({
        variant: 'destructive',
        title: 'Identity Required',
        description: 'Please enter a name and title before generating a photo.',
      });
      return;
    }

    setIsGeneratingPhoto(true);
    try {
        const result = await handleGenerateProfilePhoto({ name, title });
        if (result.success && result.data?.photoDataUri) {
          form.setValue('imageUrl', result.data.photoDataUri);
          toast({ title: 'AI Rendering Complete' });
        } else {
          toast({ variant: 'destructive', title: 'AI Limit Reached', description: result.error });
        }
    } catch (err) {
        toast({ variant: 'destructive', title: 'Generation Blocked' });
    } finally {
        setIsGeneratingPhoto(false);
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
      <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        <DialogHeader className="p-6 bg-primary/5 border-b">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">{profile ? 'Edit Registry' : 'New Staff Profile'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1">
            <div className="p-8">
                <Form {...form}>
                <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Full Name *</FormLabel>
                          <FormControl><Input placeholder="E.g., Deacon James Thompson" {...field} className="h-12 text-lg" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Title/Position *</FormLabel>
                          <FormControl><Input placeholder="E.g., Permanent Deacon" {...field} className="h-12 text-lg" /></FormControl>
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
                        <FormLabel className="font-bold">Registry Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="h-12"><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
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
                          <FormLabel className="font-bold">Biography</FormLabel>
                            <Button type="button" variant="ghost" size="icon" onClick={() => setIsBioModalOpen(true)}>
                                <Expand className="h-4 w-4" />
                            </Button>
                        </div>
                        <FormControl><Textarea placeholder="Tell us about this person" className="resize-none h-32" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Email</FormLabel>
                          <FormControl><Input type="email" placeholder="person@example.com" {...field} className="h-12" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Phone</FormLabel>
                          <FormControl>
                            <PhoneInput
                              placeholder="712 345 678"
                              {...field}
                              className="h-12"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {imagePreview && (imagePreview.startsWith('http') || imagePreview.startsWith('data:')) && (
                    <div className="mt-4 p-6 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
                        <FormLabel className="font-bold uppercase tracking-widest text-[10px]">Photo Preview</FormLabel>
                        <div className="mt-4 relative w-48 h-48 rounded-full border-4 border-white shadow-xl mx-auto isolate overflow-hidden bg-white">
                            {imageError ? (
                                <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                                    <ImageIcon className="h-16 w-16 opacity-20" />
                                </div>
                            ) : (
                                <Image 
                                    src={imagePreview} 
                                    alt="Profile" 
                                    fill 
                                    className="object-cover" 
                                    unoptimized
                                    onError={() => setImageError(true)}
                                />
                            )}
                            <button 
                              type="button"
                              className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-2xl z-50 bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all" 
                              onClick={() => { form.setValue('imageUrl', ''); setImageError(false); }}
                            >
                              <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                   )}

                  <div className="space-y-4">
                    <FormLabel className="font-bold">Profile Assets</FormLabel>
                    <div className="flex flex-wrap gap-4">
                        <Button type="button" variant="outline" className="h-12 px-6 rounded-full gap-2 border-2 border-primary/20 hover:bg-primary/5 transition-all" onClick={handleGeneratePhotoClick} disabled={isGeneratingPhoto}>
                            {isGeneratingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary"/>}
                            {isGeneratingPhoto ? 'Generating AI Photo...' : 'Generate with AI'}
                        </Button>
                        <div className="flex-grow">
                             <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*"/>
                             <Button asChild variant="secondary" className="h-12 px-8 rounded-full w-full cursor-pointer">
                                <label htmlFor="file-upload" className="flex items-center justify-center gap-2">
                                    <Upload className="h-4 w-4" />
                                    Upload Official Photo
                                </label>
                            </Button>
                        </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-2xl border-2 p-6 bg-white shadow-sm">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-6 w-6" /></FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-bold">Activate Profile</FormLabel>
                          <p className="text-xs text-muted-foreground">This person will appear in the public staff directory.</p>
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
                title="Edit Staff Biography"
            />
        )}
        <DialogFooter className="p-6 bg-muted/10 border-t mt-auto gap-4">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full h-12 px-8">Cancel</Button>
            <Button type="submit" form="profile-form" className="rounded-full h-12 px-12 font-black shadow-xl">
                {profile ? 'SAVE CHANGES' : 'COMMIT TO REGISTRY'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
