'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, RotateCcw, Palette, Link as LinkIcon, X, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useRouter } from 'next/navigation';

import type { SiteContent, SiteSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError, useDoc, useStorage, useUser } from '@/firebase';
import { collection, doc, setDoc, updateDoc, writeBatch, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Skeleton } from '@/components/ui/skeleton';

const brandingSchema = z.object({
  brandName: z.string().min(1, "Brand name is required"),
  logoUrl: z.string().optional(),
  parishDescription: z.string().min(10, "Description is required"),
  copyrightYear: z.coerce.number().min(2020),
  heroTitle: z.string().optional(),
  heroTitleColor: z.string().optional(),
  heroDescriptionColor: z.string().optional(),
  heroImageUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  globalTextColor: z.string().optional(),
  
  massTitle: z.string().optional(), massDescription: z.string().optional(), massTitleColor: z.string().optional(), massDescriptionColor: z.string().optional(), massBoxColor: z.string().optional(), massImageUrl: z.string().optional(),
  eventsTitle: z.string().optional(), eventsDescription: z.string().optional(), eventsTitleColor: z.string().optional(), eventsDescriptionColor: z.string().optional(), eventsBoxColor: z.string().optional(), eventsImageUrl: z.string().optional(),
  clergyTitle: z.string().optional(), clergyDescription: z.string().optional(), clergyTitleColor: z.string().optional(), clergyDescriptionColor: z.string().optional(), clergyBoxColor: z.string().optional(), clergyImageUrl: z.string().optional(),
  communityTitle: z.string().optional(), communityDescription: z.string().optional(), communityTitleColor: z.string().optional(), communityDescriptionColor: z.string().optional(), communityBoxColor: z.string().optional(), communityImageUrl: z.string().optional(),
  bulletinTitle: z.string().optional(), bulletinDescription: z.string().optional(), bulletinTitleColor: z.string().optional(), bulletinDescriptionColor: z.string().optional(), bulletinBoxColor: z.string().optional(), bulletinImageUrl: z.string().optional(),
  projectsTitle: z.string().optional(), projectsDescription: z.string().optional(), projectsTitleColor: z.string().optional(), projectsDescriptionColor: z.string().optional(), projectsBoxColor: z.string().optional(), projectsImageUrl: z.string().optional(),
});

const contentSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    imageUrl: z.string().optional(),
});

const SectionControls = ({ form, prefix, label, onReset, onImageUpload }: { form: any, prefix: string, label: string, onReset: (p: string) => void, onImageUpload: (p: string, f: File) => Promise<void> }) => {
    const imageUrl = form.watch(`${prefix}ImageUrl`);
    return (
        <Card className="mb-6 border-l-4 border-l-primary shadow-sm">
            <CardHeader className="py-4 flex flex-row items-center justify-between bg-muted/10">
                <CardTitle className="text-lg font-bold">{label} Header & Style</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => onReset(prefix)}>
                    <RotateCcw className="h-3 w-3 mr-2" /> Reset Section
                </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name={`${prefix}Title`} render={({field}) => <FormItem><FormLabel>Section Title</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder={`e.g., ${label}`} /></FormControl></FormItem>} />
                    <FormField control={form.control} name={`${prefix}Description`} render={({field}) => <FormItem><FormLabel>Section Description</FormLabel><FormControl><Textarea {...field} value={field.value || ''} placeholder="Add a short subtitle for this section..." /></FormControl></FormItem>} />
                </div>
                
                <div className="space-y-4">
                    <FormLabel>Section Banner Image</FormLabel>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Tabs defaultValue="upload" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-2"/> Upload</TabsTrigger>
                                    <TabsTrigger value="url"><LinkIcon className="h-4 w-4 mr-2"/> URL</TabsTrigger>
                                </TabsList>
                                <TabsContent value="upload">
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors">
                                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                        <span className="text-xs font-semibold">Click to upload banner</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && onImageUpload(prefix, e.target.files[0])} />
                                    </label>
                                </TabsContent>
                                <TabsContent value="url">
                                    <FormField control={form.control} name={`${prefix}ImageUrl`} render={({field}) => <FormControl><Input {...field} value={field.value || ''} placeholder="https://..." /></FormControl>} />
                                </TabsContent>
                            </Tabs>
                        </div>
                        {imageUrl && (
                            <div className="relative aspect-video rounded-lg border bg-muted overflow-hidden">
                                <Image src={imageUrl} alt="Section banner" fill className="object-cover" unoptimized />
                                <button type="button" className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-2xl z-50 bg-white text-black hover:bg-white/90 hover:scale-110 transition-all border-2 border-black/10 flex items-center justify-center" onClick={() => form.setValue(`${prefix}ImageUrl`, '')}><X className="h-4 w-4 text-destructive stroke-[3px]" /></button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-dashed">
                    <FormField control={form.control} name={`${prefix}TitleColor`} render={({field}) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Title Color</FormLabel>
                            <div className="flex gap-2">
                                <FormControl><Input type="color" {...field} value={field.value || '#1e3a5f'} className="w-12 h-10 p-1 cursor-pointer"/></FormControl>
                                <Button type="button" variant="ghost" size="icon" className="h-10 w-10" onClick={() => form.setValue(`${prefix}TitleColor`, '')}><RotateCcw className="h-4 w-4"/></Button>
                            </div>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name={`${prefix}DescriptionColor`} render={({field}) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Description Color</FormLabel>
                            <div className="flex gap-2">
                                <FormControl><Input type="color" {...field} value={field.value || '#4b5563'} className="w-12 h-10 p-1 cursor-pointer"/></FormControl>
                                <Button type="button" variant="ghost" size="icon" className="h-10 w-10" onClick={() => form.setValue(`${prefix}DescriptionColor`, '')}><RotateCcw className="h-4 w-4"/></Button>
                            </div>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name={`${prefix}BoxColor`} render={({field}) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Box Background</FormLabel>
                            <div className="flex gap-2">
                                <FormControl><Input type="color" {...field} value={field.value || '#ffffff'} className="w-12 h-10 p-1 cursor-pointer"/></FormControl>
                                <Button type="button" variant="ghost" size="icon" className="h-10 w-10" onClick={() => form.setValue(`${prefix}BoxColor`, '')}><RotateCcw className="h-4 w-4"/></Button>
                            </div>
                        </FormItem>
                    )} />
                </div>
            </CardContent>
        </Card>
    );
};

export default function BrandingPage() {
    const firestore = useFirestore();
    const storage = useStorage();
    const { user } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'main') : null, [firestore]);
    const { data: settings, isLoading } = useDoc<SiteSettings>(settingsRef);

    const siteContentQuery = useMemoFirebase(() => firestore ? collection(firestore, 'site_content') : null, [firestore]);
    const { data: allContent, isLoading: contentLoading } = useCollection<SiteContent>(siteContentQuery);
    const [selectedContentId, setSelectedContentId] = useState<string>('');
    const selectedContent = allContent?.find((c) => c.id === selectedContentId);

    const form = useForm<z.infer<typeof brandingSchema>>({
        resolver: zodResolver(brandingSchema),
        defaultValues: {
            brandName: 'St. Martin De Porres',
            logoUrl: '',
            parishDescription: 'A community of faith, hope, and love serving the heart of Nakuru.',
            copyrightYear: new Date().getFullYear(),
            heroTitle: 'St. Martin De Porres Catholic Church',
            heroTitleColor: '#ffffff',
            heroDescriptionColor: '#e5e7eb',
            heroImageUrl: 'https://picsum.photos/seed/hero/1200/800',
            primaryColor: '#d4a574',
            secondaryColor: '#fdf2f2',
            globalTextColor: '#1e3a5f',
        }
    });

    const contentForm = useForm<z.infer<typeof contentSchema>>({
        resolver: zodResolver(contentSchema),
        defaultValues: { title: '', content: '', imageUrl: '' }
    });

    // Seeder for all static pages
    useEffect(() => {
        if (!firestore) return;
        const seedData = async () => {
            const batch = writeBatch(firestore);
            const contentRef = collection(firestore, 'site_content');
            
            const blocks = [
                { id: 'about-us', pageName: 'About Us', title: 'Our History', content: '<p>Founded in 1962, St. Martin De Porres Parish has grown from a small community into a vibrant parish family.</p>', imageUrl: 'https://picsum.photos/seed/history/800/600' },
                { id: 'about-dev-team', pageName: 'About Us', title: 'Development Team', content: '<p>Developed by the St. Martin Youth Serving Christ (YSC) group.</p>', imageUrl: 'https://picsum.photos/seed/dev-team/800/600' },
                { id: 'privacy-policy', pageName: 'Legal', title: 'Privacy Policy', content: '<h2>Privacy Policy</h2><p>Your privacy is important to us...</p>' },
                { id: 'terms-of-use', pageName: 'Legal', title: 'Terms of Use', content: '<h2>Terms of Use</h2><p>Welcome to our site...</p>' }
            ];

            for (const b of blocks) {
                const docRef = doc(contentRef, b.id);
                const snap = await getDoc(docRef);
                if (!snap.exists()) {
                    batch.set(docRef, b);
                }
            }
            await batch.commit();
        };
        seedData();
    }, [firestore]);

    useEffect(() => {
        if(settings) {
            form.reset({
                ...settings,
                brandName: settings.brandName ?? 'St. Martin De Porres',
                logoUrl: settings.logoUrl ?? '',
                parishDescription: settings.parishDescription ?? 'A community of faith, hope, and love serving the heart of Nakuru.',
                copyrightYear: settings.copyrightYear ?? new Date().getFullYear(),
                heroTitle: settings.heroTitle ?? 'St. Martin De Porres Catholic Church',
                heroTitleColor: settings.heroTitleColor ?? '#ffffff',
                heroDescriptionColor: settings.heroDescriptionColor ?? '#e5e7eb',
                heroImageUrl: settings.heroImageUrl ?? 'https://picsum.photos/seed/hero/1200/800',
                primaryColor: settings.primaryColor ?? '#d4a574',
                secondaryColor: settings.secondaryColor ?? '#fdf2f2',
                globalTextColor: settings.globalTextColor ?? '#1e3a5f',
            });
            setLogoPreview(settings.logoUrl || null);
        }
    }, [settings, form]);

    useEffect(() => {
        if (allContent && allContent.length > 0 && !selectedContentId) {
          setSelectedContentId(allContent[0].id);
        }
    }, [allContent, selectedContentId]);

    // Force editor to update when switching pages
    useEffect(() => {
        if (selectedContent) {
            contentForm.reset({ 
                title: selectedContent.title ?? '', 
                content: selectedContent.content ?? '', 
                imageUrl: selectedContent.imageUrl ?? '',
            });
        }
    }, [selectedContent, contentForm]);

    const handleImageUpload = async (prefix: string, file: File) => {
        if (!storage) return;
        try {
            const storageRef = ref(storage, `banners/${prefix}_${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            form.setValue(`${prefix}ImageUrl` as any, url);
            toast({ title: 'Image Uploaded' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
        }
    };

    const handleContentImageUpload = async (file: File) => {
        if (!storage) return;
        try {
            const storageRef = ref(storage, `content/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            contentForm.setValue('imageUrl', url);
            toast({ title: 'Page Image Uploaded' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !storage) return;
        setLogoPreview(URL.createObjectURL(file));
        try {
            const storageRef = ref(storage, `branding/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            form.setValue('logoUrl', url);
            toast({ title: 'Logo Uploaded' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Logo Failed', description: error.message });
        }
    };

    const handleSectionReset = async (prefix: string) => {
        if (!settingsRef) return;
        const defaults: Record<string, { title: string, desc: string, img: string }> = {
            hero: { title: 'St. Martin De Porres Catholic Church', desc: 'A community of faith, hope, and love serving the heart of Nakuru.', img: 'https://picsum.photos/seed/hero/1200/800' },
            mass: { title: 'Weekly Mass Schedule', desc: 'Join us for worship throughout the week.', img: '' },
            events: { title: 'Upcoming Events', desc: 'Join us for worship, fellowship, and service.', img: '' },
            clergy: { title: 'Meet Our Clergy & Staff', desc: 'The dedicated team serving our parish family.', img: '' },
            bulletin: { title: 'Latest Updates', desc: 'Stay informed with the latest news.', img: '' },
            projects: { title: 'Parish Projects', desc: 'Supporting our mission and growth.', img: '' },
            community: { title: 'Parish Communities', desc: 'Connect with our Small Christian Communities and groups.', img: '' },
            ministries: { title: 'Our Ministries', desc: 'Serving God and our community through action.', img: '' },
            bibleReadings: { title: 'Daily Bible Readings', desc: 'Nourish your soul with the Word of God each day.', img: '' },
            documents: { title: 'Parish Documents', desc: 'Stay informed with our latest bulletins and documents.', img: '' },
            findUs: { title: 'Find Us', desc: "Located in the heart of Nakuru, we're easy to find and accessible to all.", img: '' },
            payments: { title: 'Payments & Giving', desc: 'Support our parish through secure digital payments.', img: '' },
        };

        const d = defaults[prefix] || { title: '', desc: '', img: '' };
        const resetData = { [`${prefix}Title`]: d.title, [`${prefix}Description`]: d.desc, [`${prefix}TitleColor`]: '', [`${prefix}DescriptionColor`]: '', [`${prefix}BoxColor`]: '', [`${prefix}ImageUrl`]: d.img };

        updateDoc(settingsRef, resetData).then(() => {
            form.setValue(`${prefix}Title` as any, d.title);
            form.setValue(`${prefix}Description` as any, d.desc);
            form.setValue(`${prefix}ImageUrl` as any, d.img);
            toast({ title: 'Section Reset' });
        });
    };

    const onSubmitBranding = (values: z.infer<typeof brandingSchema>) => {
        if (!settingsRef) return;
        setIsSaving(true);
        const sanitizedData = JSON.parse(JSON.stringify(values));
        setDoc(settingsRef, sanitizedData, { merge: true })
            .then(() => { toast({ title: 'Success!', description: 'Visual settings updated.' }); router.refresh(); })
            .finally(() => setIsSaving(false));
    };

    const onSubmitContent = (values: any) => {
        if (!firestore || !selectedContent) return;
        const contentRef = doc(firestore, 'site_content', selectedContent.id);
        updateDoc(contentRef, values).then(() => {
            toast({ title: 'Success!', description: 'Page content updated.' });
            router.refresh();
        });
    };

    if (isLoading || contentLoading) return <Skeleton className="h-96 w-full" />;

    return (
        <div className="space-y-6 py-6 px-4 max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
                <Palette className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">Branding & Visuals</h1>
            </div>
            
            <Tabs defaultValue="identity" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="identity">Identity & Colors</TabsTrigger>
                    <TabsTrigger value="pages">Edit Page Content</TabsTrigger>
                </TabsList>
                
                <TabsContent value="identity" className="space-y-8 pt-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmitBranding)} className="space-y-8 pb-20">
                            <Card className="shadow-md">
                                <CardHeader className="bg-primary/5"><CardTitle>Primary Identity</CardTitle></CardHeader>
                                <CardContent className="space-y-6 pt-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="brandName" render={({field}) => <FormItem><FormLabel>Parish Brand Name</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>} />
                                        <FormField control={form.control} name="heroTitle" render={({field}) => <FormItem><FormLabel>Hero Welcome Title</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>} />
                                    </div>
                                    <FormField control={form.control} name="parishDescription" render={({field}) => <FormItem><FormLabel>Parish Tagline</FormLabel><FormControl><Textarea {...field} value={field.value || ''} /></FormControl></FormItem>} />
                                    
                                    <div className="space-y-4 pt-4 border-t">
                                        <FormLabel>Church Logo</FormLabel>
                                        <div className="flex items-center gap-6">
                                            <div className="relative h-24 w-24 rounded-full border-2 border-primary/20 bg-muted overflow-hidden">
                                                {logoPreview ? <Image src={logoPreview} alt="Logo" fill className="object-cover" unoptimized /> : null}
                                            </div>
                                            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer p-6 hover:bg-muted transition-colors">
                                                <Upload className="w-8 h-8 mb-2 text-primary" />
                                                <span className="text-sm font-semibold">Upload New Logo</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                            </label>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <SectionControls form={form} prefix="hero" label="Main Hero Banner" onReset={handleSectionReset} onImageUpload={handleImageUpload} />
                            
                            <div className="space-y-6">
                                <div className="border-b pb-4"><h3 className="text-2xl font-bold">Section-Specific Styling</h3></div>
                                <SectionControls form={form} prefix="mass" label="Mass Schedule" onReset={handleSectionReset} onImageUpload={handleImageUpload} />
                                <SectionControls form={form} prefix="events" label="Upcoming Events" onReset={handleSectionReset} onImageUpload={handleImageUpload} />
                                <SectionControls form={form} prefix="clergy" label="Meet Our Clergy" onReset={handleSectionReset} onImageUpload={handleImageUpload} />
                                <SectionControls form={form} prefix="community" label="Parish Communities" onReset={handleSectionReset} onImageUpload={handleImageUpload} />
                                <SectionControls form={form} prefix="bulletin" label="Latest Updates" onReset={handleSectionReset} onImageUpload={handleImageUpload} />
                                <SectionControls form={form} prefix="projects" label="Parish Projects" onReset={handleSectionReset} onImageUpload={handleImageUpload} />
                            </div>

                            <div className="flex justify-end sticky bottom-6 z-50">
                                <Button type="submit" size="lg" className="shadow-2xl rounded-full px-12 h-16 text-lg font-bold" disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                    Save All Visual Changes
                                </Button>
                            </div>
                        </form>
                    </Form>
                </TabsContent>

                <TabsContent value="pages" className="space-y-6 pt-6">
                    <Card className="shadow-md">
                        <CardHeader className="bg-primary/5"><CardTitle>Static Page Management</CardTitle></CardHeader>
                        <CardContent className="pt-6">
                            <Form {...contentForm}>
                                <form onSubmit={contentForm.handleSubmit(onSubmitContent)} key={selectedContentId} className="space-y-6">
                                    <div className="space-y-2">
                                        <FormLabel>Select Page to Edit</FormLabel>
                                        <Select onValueChange={setSelectedContentId} value={selectedContentId}>
                                            <SelectTrigger className="h-12"><SelectValue placeholder="Select a page..." /></SelectTrigger>
                                            <SelectContent>{allContent?.map((c) => <SelectItem key={c.id} value={c.id}>{c.pageName}: {c.title}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    {selectedContent && (
                                        <>
                                            <FormField control={contentForm.control} name="title" render={({ field }) => (
                                                <FormItem><FormLabel>Headline</FormLabel><FormControl><Input {...field} className="h-12 text-lg" /></FormControl></FormItem>
                                            )}/>
                                            <FormField control={contentForm.control} name="content" render={({ field }) => (
                                                <FormItem><FormLabel>Page Content</FormLabel><FormControl><RichTextEditor value={field.value || ''} onChange={field.onChange} /></FormControl></FormItem>
                                            )}/>
                                            
                                            <div className="space-y-4 pt-4 border-t">
                                                <FormLabel>Cover Image</FormLabel>
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <Tabs defaultValue="upload" className="w-full">
                                                            <TabsList className="grid w-full grid-cols-2">
                                                                <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-2"/> Upload</TabsTrigger>
                                                                <TabsTrigger value="url"><LinkIcon className="h-4 w-4 mr-2"/> URL</TabsTrigger>
                                                            </TabsList>
                                                            <TabsContent value="upload" className="pt-2">
                                                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors">
                                                                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleContentImageUpload(e.target.files[0])} />
                                                                </label>
                                                            </TabsContent>
                                                            <TabsContent value="url" className="pt-2">
                                                                <FormField control={contentForm.control} name="imageUrl" render={({field}) => <FormControl><Input {...field} value={field.value || ''} placeholder="https://..." /></FormControl>}/>
                                                            </TabsContent>
                                                        </Tabs>
                                                    </div>
                                                    {contentForm.watch('imageUrl') && (
                                                        <div className="relative aspect-video rounded-lg border bg-muted overflow-hidden">
                                                            <Image src={contentForm.watch('imageUrl')!} alt="Cover" fill className="object-cover" unoptimized />
                                                            <button type="button" className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-2xl z-50 bg-white text-black hover:bg-white/90 hover:scale-110 transition-all border-2 border-black/10 flex items-center justify-center" onClick={() => contentForm.setValue('imageUrl', '')}><X className="h-4 w-4 text-destructive stroke-[3px]" /></button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex justify-end border-t pt-6"><Button type="submit" size="lg">Update Page Data</Button></div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
