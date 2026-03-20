'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sparkles, Loader2, Expand } from 'lucide-react';
import { useFirestore, useStorage } from '@/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { uploadSingleFile } from '@/lib/upload-utils';

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
import { ImageUpload } from './ImageUpload';


const profileSchema = z.object({
  name: z.string().min(3, 'Full Name must be at least 3 characters.'),
  title: z.string().min(3, 'Title/Position is required.'),
  role: z.enum(['Pastor', 'Associate Pastor', 'Deacon', 'Staff', 'Ministry Leader']),
  bio: z.string().min(10, 'Biography is required.'),
  email: z.string().email('Please enter a valid email.'),
  phone: z.string().min(1, 'Phone number is required.'),
  imageUrl: z.string().default(''),
  imageHint: z.string().optional(),
  active: z.boolean().default(true),
});

type ProfileFormProps = {
  profile: Profile | null;
  onClose: () => void;
};

export function ProfileForm({ profile, onClose }: ProfileFormProps) {
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPhoto, setIsGeneratingPhoto] = useState(false);
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);

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

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!firestore || !storage) return;
    
    setIsSaving(true);

    try {
      let finalPhotoUrl = values.imageUrl;
      if (photoFile) {
        finalPhotoUrl = await uploadSingleFile(storage, 'staff', photoFile);
      }

      const profileData = {
        ...values,
        imageUrl: finalPhotoUrl,
        updatedAt: serverTimestamp(),
      };

      if (profile?.id) {
        await updateDoc(doc(firestore, 'profiles', profile.id), profileData);
      } else {
        await addDoc(collection(firestore, 'profiles'), {
          ...profileData,
          createdAt: serverTimestamp(),
        });
      }

      toast({ title: 'Success', description: 'Staff profile updated successfully.' });
      onClose();
    } catch (error: any) {
      console.error('[Profile] Save failed:', error);
      const isConnectionError = error.message?.includes('ERR_PROXY_CONNECTION_FAILED') || 
                                 error.message?.includes('Network Error') ||
                                 error.code === 'storage/retry-limit-exceeded';

      toast({ 
          variant: 'destructive', 
          title: isConnectionError ? 'Connection Error' : 'Error', 
          description: isConnectionError 
              ? 'Connection Error: Please check your firewall or Firebase CORS settings.' 
              : 'Failed to save profile.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePhotoClick = async () => {
    if (isGeneratingPhoto) return;

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
          setPhotoFile(null); 
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        <DialogHeader className="p-6 bg-primary/5 border-b shrink-0">
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
                          <FormControl><Input placeholder="E.g., Deacon James Thompson" {...field} className="h-12 text-lg font-bold" /></FormControl>
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

                  <FormField name="imageUrl" render={() => (
                      <FormItem className="space-y-4">
                        <ImageUpload 
                          value={form.watch('imageUrl')} 
                          file={photoFile}
                          onChange={(url, file) => {
                            form.setValue('imageUrl', url);
                            setPhotoFile(file);
                          }}
                          folder="staff" 
                          label="Official Profile Photo *" 
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="w-full h-12 rounded-xl gap-2 border-2 border-primary/20 hover:bg-primary/5 transition-all" 
                          onClick={handleGeneratePhotoClick} 
                          disabled={isGeneratingPhoto || isSaving}
                        >
                          {isGeneratingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary"/>}
                          {isGeneratingPhoto ? 'Generating AI Photo...' : 'Or Generate Professional Photo with AI'}
                        </Button>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
        <DialogFooter className="p-6 bg-muted/10 border-t mt-auto gap-4 shrink-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving} className="rounded-full h-12 px-8">Cancel</Button>
            <Button type="submit" form="profile-form" disabled={isSaving} className="rounded-full h-12 px-12 font-black shadow-xl">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {profile ? 'SAVE CHANGES' : 'COMMIT TO REGISTRY'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
