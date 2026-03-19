'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { RotateCcw, Palette as PaletteIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useRouter } from 'next/navigation';

import type { SiteContent, SiteSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageUpload } from '@/components/admin/ImageUpload';

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

const SectionControls = ({ form, prefix, label, onReset }: { form: any, prefix: string, label: string, onReset: (p: string) => void }) => {
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
                    <FormField control={form.control} name={`${prefix}Title`} render={({field}) => <FormItem><FormLabel>Section Title</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder={`e.g., ${label}`} autoComplete="off" /></FormControl></FormItem>} />
                    <FormField control={form.control} name={`${prefix}Description`} render={({field}) => <FormItem><FormLabel>Section Description</FormLabel><FormControl><Textarea {...field} value={field.value || ''} placeholder="Add a short subtitle for this section..." /></FormControl></FormItem>} />
                </div>
                
                <FormField control={form.control} name={`${prefix}ImageUrl`} render={({field}) => (
                    <FormItem>
                        <ImageUpload 
                          value={field.value || ''} 
                          onChange={field.onChange} 
                          folder="banners" 
                          label="Section Banner Image" 
                        />
                    </FormItem>
                )} />

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
    const router = useRouter();
    const { toast } = useToast();

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
            heroImageUrl: '',
            primaryColor: '#d4a574',
            secondaryColor: '#fdf2f2',
            globalTextColor: '#1e3a5f',
        }
    });

    const contentForm = useForm<z.infer<typeof contentSchema>>({
        resolver: zodResolver(contentSchema),
        defaultValues: { title: '', content: '', imageUrl: '' }
    });

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
                heroImageUrl: settings.heroImageUrl ?? '',
                primaryColor: settings.primaryColor ?? '#d4a574',
                secondaryColor: settings.secondaryColor ?? '#fdf2f2',
                globalTextColor: settings.globalTextColor ?? '#1e3a5f',
            });
        }
    }, [settings, form]);

    useEffect(() => {
        if (allContent && allContent.length > 0 && !selectedContentId) {
          setSelectedContentId(allContent[0].id);
        }
    }, [allContent, selectedContentId]);

    useEffect(() => {
        if (selectedContent) {
            contentForm.reset({ 
                title: selectedContent.title ?? '', 
                content: selectedContent.content ?? '', 
                imageUrl: selectedContent.imageUrl ?? '',
            });
        }
    }, [selectedContent, contentForm]);

    const handleSectionReset = async (prefix: string) => {
        if (!settingsRef) return;
        const defaults: Record<string, { title: string, desc: string, img: string }> = {
            hero: { title: 'St. Martin De Porres Catholic Church', desc: 'A community of faith, hope, and love serving the heart of Nakuru.', img: '' },
            mass: { title: 'Weekly Mass Schedule', desc: 'Join us for worship throughout the week.', img: '' },
            events: { title: 'Upcoming Events', desc: 'Join us for worship, fellowship, and service.', img: '' },
            clergy: { title: 'Meet Our Clergy & Staff', desc: 'The dedicated team serving our parish family.', img: '' },
            bulletin: { title: 'Latest Updates', desc: 'Stay informed with the latest news.', img: '' },
            projects: { title: 'Parish Projects', desc: 'Supporting our mission and growth.', img: '' },
            community: { title: 'Parish Communities', desc: 'Connect with our Small Christian Communities and groups.', img: '' },
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
        // Strip local blobs
        const sanitizedValues = { ...values };
        Object.keys(sanitizedValues).forEach(k => {
            const val = (sanitizedValues as any)[k];
            if (typeof val === 'string' && val.startsWith('blob:')) {
                (sanitizedValues as any)[k] = '';
            }
        });
        toast({ title: 'Visuals Synchronized' });
        setDoc(settingsRef, sanitizedValues, { merge: true }).then(() => router.refresh());
    };

    const onSubmitContent = (values: any) => {
        if (!firestore || !selectedContent) return;
        toast({ title: 'Page Content Updated' });
        const sanitizedValues = { ...values };
        if (sanitizedValues.imageUrl?.startsWith('blob:')) sanitizedValues.imageUrl = '';
        const contentRef = doc(firestore, 'site_content', selectedContent.id);
        updateDoc(contentRef, sanitizedValues).then(() => router.refresh());
    };

    if (isLoading || contentLoading) return <Skeleton className="h-96 w-full" />;

    return (
        <div className="space-y-6 py-6 px-4 max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
                <PaletteIcon className="h-8 w-8 text-primary" />
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
                                        <FormField control={form.control} name="brandName" render={({field}) => <FormItem><FormLabel>Parish Brand Name</FormLabel><FormControl><Input {...field} value={field.value || ''} autoComplete="off" /></FormControl></FormItem>} />
                                        <FormField control={form.control} name="heroTitle" render={({field}) => <FormItem><FormLabel>Hero Welcome Title</FormLabel><FormControl><Input {...field} value={field.value || ''} autoComplete="off" /></FormControl></FormItem>} />
                                    </div>
                                    <FormField control={form.control} name="parishDescription" render={({field}) => <FormItem><FormLabel>Parish Tagline</FormLabel><FormControl><Textarea {...field} value={field.value || ''} /></FormControl></FormItem>} />
                                    
                                    <FormField control={form.control} name="logoUrl" render={({field}) => (
                                        <FormItem>
                                            <ImageUpload 
                                              value={field.value || ''} 
                                              onChange={field.onChange} 
                                              folder="branding" 
                                              label="Official Church Logo" 
                                            />
                                        </FormItem>
                                    )} />
                                </CardContent>
                            </Card>

                            <SectionControls form={form} prefix="hero" label="Main Hero Banner" onReset={handleSectionReset} />
                            
                            <div className="space-y-6">
                                <div className="border-b pb-4"><h3 className="text-2xl font-bold">Section-Specific Styling</h3></div>
                                <SectionControls form={form} prefix="mass" label="Mass Schedule" onReset={handleSectionReset} />
                                <SectionControls form={form} prefix="events" label="Upcoming Events" onReset={handleSectionReset} />
                                <SectionControls form={form} prefix="clergy" label="Meet Our Clergy" onReset={handleSectionReset} />
                                <SectionControls form={form} prefix="community" label="Parish Communities" onReset={handleSectionReset} />
                                <SectionControls form={form} prefix="bulletin" label="Latest Updates" onReset={handleSectionReset} />
                                <SectionControls form={form} prefix="projects" label="Parish Projects" onReset={handleSectionReset} />
                            </div>

                            <div className="flex justify-end sticky bottom-6 z-50 gap-4">
                                <Button type="button" variant="outline" size="lg" className="rounded-full px-8 h-16 text-lg font-bold" onClick={() => router.push('/admin/dashboard')}>
                                    Cancel Changes
                                </Button>
                                <Button type="submit" size="lg" className="shadow-2xl rounded-full px-12 h-16 text-lg font-bold">
                                    Save Visual Identity
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
                                                <FormItem><FormLabel>Headline</FormLabel><FormControl><Input {...field} className="h-12 text-lg" autoComplete="off" /></FormControl></FormItem>
                                            )}/>
                                            <FormField control={contentForm.control} name="content" render={({ field }) => (
                                                <FormItem><FormLabel>Page Content</FormLabel><FormControl><RichTextEditor value={field.value || ''} onChange={field.onChange} /></FormControl></FormItem>
                                            )}/>
                                            
                                            <FormField control={contentForm.control} name="imageUrl" render={({field}) => (
                                                <FormItem>
                                                    <ImageUpload 
                                                      value={field.value || ''} 
                                                      onChange={field.onChange} 
                                                      folder="content" 
                                                      label="Cover Image" 
                                                    />
                                                </FormItem>
                                            )} />
                                        </>
                                    )}
                                    <div className="flex justify-end border-t pt-6 gap-4">
                                        <Button type="button" variant="outline" size="lg" onClick={() => router.push('/admin/dashboard')}>Cancel</Button>
                                        <Button type="submit" size="lg">Update Content</Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
